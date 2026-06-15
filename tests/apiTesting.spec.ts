import { test, expect } from '@playwright/test';

test.describe('API Katmanı Testleri (UI Bağımsız)', () => {

    test('Yeni bir kullanıcının API üzerinden yaratılması ve JSON şemasının doğrulanması', async ({ request }) => {

        // ==========================================
        // 1. DÜZELTME: KISA VE BENZERSİZ ID (Sınır Değer Uyumu)
        // 20 karakter sınırını aşmamak için 8 haneli rastgele bir
        // alfanümerik dize üretiyoruz (Örn: 'xk9j2m4p')
        // ==========================================
        const uniqueId = Math.random().toString(36).substring(2, 10);

        const testUser = {
            username: `api_${uniqueId}`, // Toplam 12 karakter (20'nin altında)
            email: `api_${uniqueId}@test.com`,
            password: 'Password123!'     // Toplam 12 karakter (20'nin altında)
        };

        const response = await request.post('https://conduit-api.bondaracademy.com/api/users', {
            data: {
                user: testUser
            }
        });

        // ==========================================
        // 2. MÜHENDİSLİK DOKUNUŞU: ERROR LOGGING (Hata Yakalama)
        // Eğer sunucu bize 201 (Başarılı) dışında bir şey dönerse,
        // test patlamadan hemen önce gerçek sebebi ('email has already been taken' vb.)
        // Playwright konsoluna yazdırıyoruz.
        // ==========================================
        const responseBody = await response.json();

        if (response.status() !== 201) {
            console.error('API REDDETTİ! Sunucudan gelen hata detayı:', responseBody);
        }

        // 3. API STATUS DOĞRULAMASI
        expect(response.status()).toBe(201);
        expect(response.ok()).toBeTruthy();

        // 4. JSON ŞEMA VE VERİ DOĞRULAMASI
        expect(responseBody.user.username).toBe(testUser.username);
        expect(responseBody.user.email).toBe(testUser.email);

        // Güvenlik: Şifre kesinlikle geri dönmemeli!
        expect(responseBody.user.password).toBeUndefined();

        // Token kontrolü
        expect(responseBody.user.token).toBeTruthy();
        expect(typeof responseBody.user.token).toBe('string');
    });

    test('API Chaining: Token yakalayarak yetki (Authorization) gerektiren bir endpointi test etme', async ({ request }) => {

        // ==========================================
        // 1. PRE-CONDITION (Hazırlık): Kullanıcı yarat ve Token'ı ele geçir
        // ==========================================
        const uniqueId = Math.random().toString(36).substring(2, 10);

        const userResponse = await request.post('https://conduit-api.bondaracademy.com/api/users', {
            data: {
                user: { username: `yazar_${uniqueId}`, email: `yazar_${uniqueId}@test.com`, password: 'Password123!' }
            }
        });

        // Backend'in bize verdiği paketi açıyoruz ve 'token' değerini bir değişkene saklıyoruz
        const userData = await userResponse.json();
        const authToken = userData.user.token;

        // ==========================================
        // 2. AKSİYON (API Chaining): Yeni makale yaratma
        // Az önce cebimize koyduğumuz 'authToken'u, yeni isteğin 'headers' (Başlıklar) kısmına ekliyoruz.
        // ==========================================
        const articleTitle = `API Chaining Şaheseri ${uniqueId}`;

        const articleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
            headers: {
                // Conduit API mimarisi yetkilendirme için 'Token <şifre>' formatını kullanır
                'Authorization': `Token ${authToken}`
            },
            data: {
                article: {
                    title: articleTitle,
                    description: 'UI olmadan, tamamen API üzerinden makale oluşturma testi',
                    body: 'Bu makale arka arkaya atılan iki farklı API isteğinin (Chaining) sonucudur.',
                    tagList: ['api', 'playwright', 'integration']
                }
            }
        });

        // ==========================================
        // 3. MİMARİ VE VERİ DOĞRULAMALARI (Assertions)
        // ==========================================

        // A. İsteğin başarıyla (200 veya 201) sonuçlandığını teyit et
        expect(articleResponse.ok()).toBeTruthy();

        const articleData = await articleResponse.json();

        // B. Data Integrity (Veri Bütünlüğü) Kontrolü
        // API'nin bizim gönderdiğimiz başlığı bozmadan veritabanına yazdığını kanıtlıyoruz.
        expect(articleData.article.title).toBe(articleTitle);

        // C. Güvenlik ve İlişki Kontrolü (En Can Alıcı Nokta!)
        // Makaleyi yaratan 'author' (yazar) bilgisinin, 1. adımda yarattığımız kullanıcıyla
        // eşleştiğini test ediyoruz. Yani token gerçekten doğru hesaba aitmiş!
        expect(articleData.article.author.username).toBe(`yazar_${uniqueId}`);
    });

    test('API Güvenlik Testi: Geçersiz token ile yetki gerektiren (Private) işlemlere erişimin engellenmesi', async ({ request }) => {

        // ==========================================
        // 1. KASITLI SIZMA GİRİŞİMİ (Hacking Simulation)
        // Yeni bir makale yaratmaya çalışıyoruz ama 'Authorization'
        // başlığına tamamen uydurma, geçersiz bir Token koyuyoruz.
        // ==========================================
        const response = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
            headers: {
                'Authorization': 'Token benim_uydurdugum_sahte_hacker_tokeni_999'
            },
            data: {
                article: {
                    title: 'Güvenlik Açığı Testi',
                    description: 'Eğer bu makale yayınlanırsa yandık!',
                    body: 'Bu metnin veritabanına KESİNLİKLE yazılmaması gerekiyor.',
                    tagList: ['hacked', 'security-fail']
                }
            }
        });

        // ==========================================
        // 2. MİMARİ VE GÜVENLİK DOĞRULAMALARI (Assertions)
        // ==========================================

        // A. Güvenlik Duvarı Kontrolü:
        // Backend'in bizi kapıdan çevirdiğini ve 401 (Unauthorized) durum kodunu döndüğünü teyit ediyoruz.
        // Not: Bazı mimarilerde bu 403 (Forbidden) de olabilir, Conduit 401 kullanır.
        expect(response.status()).toBe(401);

        // B. İşlem Başarısızlığı Kontrolü:
        // response.ok() metodu sadece 200-299 arası kodlarda 'true' döner.
        // Biz burada işlemin KESİNLİKLE başarısız olduğunu (false döndüğünü) kanıtlıyoruz.
        expect(response.ok()).toBeFalsy();
    });

});