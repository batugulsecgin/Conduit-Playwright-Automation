import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ArticlePage } from '../pages/ArticlePage';

test.describe('Makale Yönetimi (CRUD) İşlemleri', () => {

    test('Kullanıcı yeni bir makale oluşturabilmeli ve silebilmeli', async ({ page }) => {
        // Page sınıflarımızdan nesne (object) üretiyoruz
        const homePage = new HomePage(page);
        const articlePage = new ArticlePage(page);

        // Her makalenin benzersiz olması için anlık zaman damgası kullanıyoruz
        const uniqueTitle = `Playwright ile Otomasyon ${Date.now()}`;

        // 1. ADIM: Anasayfaya git (Giriş yapmamıza gerek yok, Storage State devreye girecek!)
        await homePage.goto();

        // 2. ADIM: Yeni makale oluşturma sayfasına geç ve formu doldur
        await homePage.clickNewArticle();
        await articlePage.publishNewArticle(
            uniqueTitle,
            'TypeScript ve Playwright Gücü',
            'Bu makale Playwright POM mimarisi kullanılarak tamamen otomatik oluşturulmuştur.',
            'e2e-testing'
        );

        // 3. ADIM: Doğrulama (Makalenin başarıyla yayınlandığını h1 etiketinden anlıyoruz)
        // Playwright'ın otomatik bekleme (auto-wait) özelliği sayesinde explicit wait yazmamıza gerek yok
        const articleHeader = page.locator('h1').filter({ hasText: uniqueTitle });
        await expect(articleHeader).toBeVisible();

        // 4. ADIM: Temizlik (Sistemi eski haline getirme - Delete)
        await articlePage.deleteButton.click();

        // Makale silindikten sonra anasayfa URL'sine yönlendirildiğimizi doğruluyoruz
        await expect(page).toHaveURL('https://conduit.bondaracademy.com/');

        // Global Feed sekmesinin ekranda görünür olduğunu doğruluyoruz
        await expect(homePage.globalFeedTab).toBeVisible();
    });

    test('Var olan bir makalenin güncellenmesi (Update) ve dinamik URL (Slug) değişimi', async ({ page }) => {
        const homePage = new HomePage(page);
        const articlePage = new ArticlePage(page);

        const initialTitle = `Orijinal Başlık ${Date.now()}`;
        const updatedTitle = `Güncellenmiş Başlık ${Date.now()}`;

        // ==========================================
        // 1. PRE-CONDITION (Hazırlık): Düzenleyeceğimiz bir makale yaratıyoruz
        // ==========================================
        await homePage.goto();
        await homePage.clickNewArticle();
        await articlePage.publishNewArticle(
            initialTitle,
            'Update Testi Açıklaması',
            'Bu metin birazdan Playwright tarafından silinip güncellenecek.',
            'update-test'
        );

        // Makalenin başarıyla yaratıldığını doğrula
        await expect(page.locator('h1').filter({ hasText: initialTitle })).toBeVisible();

        // Orijinal sayfanın URL'sini (Slug'ı) hafızaya alıyoruz
        const initialUrl = page.url();

        // ==========================================
        // 2. AKSİYON (Update İşlemi)
        // ==========================================

        // 'Edit Article' butonuna tıkla (Aynı sayfada iki tane olabilir, ilkini seçiyoruz)
        await page.getByRole('link', { name: 'Edit Article' }).first().click();

        // Başlığı ve içeriği yeni verilerle doldur
        // Playwright'ın .fill() metodu, input'un içindeki eski metni otomatik olarak siler ve yenisini yazar.
        await articlePage.titleInput.fill(updatedTitle);
        await articlePage.bodyInput.fill('Makalenin içeriği, Update testi kapsamında başarıyla güncellendi!');

        // Formu tekrar gönder (Publish)
        await articlePage.publishButton.click();

        // ==========================================
        // 3. MİMARİ VE UI DOĞRULAMALARI (Assertions)
        // ==========================================

        // A. Arayüz Doğrulaması: Yeni başlığın h1 etiketiyle DOM'a çizildiğini teyit et
        await expect(page.locator('h1').filter({ hasText: updatedTitle })).toBeVisible();

        // B. Mimari Doğrulama (Router / Slug Testi):
        // Başlık değiştiği için uygulamanın URL'deki slug'ı güncellemesi gerekir.
        // Yeni URL'in, eski URL ile KESİNLİKLE aynı olmaması gerektiğini (not) kanıtlıyoruz.
        await expect(page).not.toHaveURL(initialUrl);

        // ==========================================
        // 4. TEMİZLİK (Environment Cleanup)
        // Testin arkasında çöp veri bırakmaması için makaleyi siliyoruz.
        // ==========================================
        await articlePage.deleteButton.click();
        await expect(homePage.globalFeedTab).toBeVisible();
    });

    test('Zorunlu alanlar boş bırakıldığında makale yayınlanmamalı ve hata mesajı gösterilmeli (Negative Test)', async ({ page }) => {
        const homePage = new HomePage(page);
        const articlePage = new ArticlePage(page);

        // 1. UI ETKİLEŞİMİ: Yeni makale sayfasına git
        await homePage.goto();
        await homePage.clickNewArticle();

        // Editör sayfasına sorunsuz geçtiğimizi URL'den teyit edelim
        await expect(page).toHaveURL(/.*editor/);

        // ==========================================
        // 2. KASITLI EYLEM (HATA SİMÜLASYONU)
        // Hiçbir zorunlu alanı (Title, Body vb.) doldurmadan,
        // doğrudan 'Publish Article' butonuna tıklıyoruz.
        // ==========================================
        await articlePage.publishButton.click();

        // ==========================================
        // 3. MİMARİ VE UX DOĞRULAMALARI (Assertions)
        // ==========================================

        // Conduit uygulamasında validasyon hataları '.error-messages' sınıfı içindeki listelerde ('li') gösterilir.
        const errorList = page.locator('.error-messages li');

        // A. Görünürlük Doğrulaması: Hata listesinin ekranda belirdiğini teyit et
        await expect(errorList.first()).toBeVisible();

        // B. UX (Kullanıcı Deneyimi) Doğrulaması:
        // Sistemin anlamsız bir hata yerine, eksik alanla ilgili ("title can't be blank" gibi)
        // mantıklı bir geri bildirim verdiğini kanıtlıyoruz.
        await expect(errorList).toContainText(/title/i);

        // C. Mimari State (Durum) Doğrulaması:
        // Hatalı işlem sonrası uygulamanın bizi yeni bir makale sayfasına YÖNLENDİRMEDİĞİNİ (Redirect yapmadığını),
        // güvenli bir şekilde editör (/editor) sayfasında tutmaya devam ettiğini teyit et!
        await expect(page).toHaveURL(/.*editor/);
    });

    test('Yetkisiz Silme Engeli (IDOR Güvenliği): Kullanıcı başkasına ait makaleyi silememeli', async ({ page, request }) => {
        const articlePage = new ArticlePage(page);

        // ==========================================
        // 1. PRE-CONDITION (API ile Kurban Kullanıcı ve Makale Üretimi)
        // Arayüzü hiç kullanmadan, tamamen backend üzerinden farklı bir yazar yaratıyoruz.
        // ==========================================
        const victimId = Date.now().toString().slice(-6);
        const victimUsername = `victim_${victimId}`;
        const victimEmail = `victim_${victimId}@test.com`;

        // A. Kurban (Victim) hesabını oluştur
        const victimUserRes = await request.post('https://conduit-api.bondaracademy.com/api/users', {
            data: { user: { username: victimUsername, email: victimEmail, password: 'Password123!' } }
        });
        const victimData = await victimUserRes.json();
        const victimToken = victimData.user.token; // Kurbanın yetki anahtarını (Token) çalıyoruz :)

        // B. Kurbanın yetkisiyle (onun token'ını kullanarak) API'den bir makale yayınla
        const articleRes = await request.post('https://conduit-api.bondaracademy.com/api/articles', {
            headers: { Authorization: `Token ${victimToken}` },
            data: {
                article: {
                    title: `Kurbanın Makalesi ${victimId}`,
                    description: 'IDOR Testi',
                    body: 'Bu makale başkasına ait, silemezsin!',
                    tagList: ['security']
                }
            }
        });
        const articleData = await articleRes.json();
        const articleSlug = articleData.article.slug; // Makalenin eşsiz URL uzantısını alıyoruz

        // ==========================================
        // 2. AKSİYON: Kendi kullanıcımızla o makaleye sızıyoruz
        // Playwright config'den dolayı biz zaten 'user.json' ile (kendi ana hesabımızla) giriş yapmış durumdayız.
        // ==========================================
        await page.goto(`/article/${articleSlug}`);

        // ==========================================
        // 3. MİMARİ VE GÜVENLİK DOĞRULAMALARI
        // ==========================================

        // A. Doğru makalede olduğumuzu ve yazarın biz DEĞİL, 'victim' olduğunu teyit et
        const authorName = page.getByRole('link', { name: victimUsername }).first();
        await expect(authorName).toBeVisible();

        // B. ASIL GÜVENLİK KONTROLÜ (Authorization / UI IDOR):
        // Kendi makalemiz olmadığı için Page Object Model'den gelen 'Delete Article'
        // butonunun DOM'a (ekrana) KESİNLİKLE çizilmediğini (not.toBeVisible) kanıtlıyoruz.
        await expect(articlePage.deleteButton).not.toBeVisible();
    });

});