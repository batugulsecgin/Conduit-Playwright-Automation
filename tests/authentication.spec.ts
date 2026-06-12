import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication & Authorization', () => {

    test('Geçerli kimlik bilgileriyle başarılı giriş yapılması ve JWT Token doğrulaması', async ({ page, request }) => {
        const loginPage = new LoginPage(page);

        // 1. DÜZELTME: Daha kısa bir benzersiz ID üretelim (Date.now'ın sadece son 5-6 rakamını alıyoruz)
        const shortId = Date.now().toString().slice(-6);
        const testUsername = `user_${shortId}`; // Örn: user_122036 (Toplam 12 karakter, çok güvenli)
        const testEmail = `auth_${shortId}@test.com`;
        const testPassword = 'SecurePassword123!';

        // İsteği bir değişkene (response) atıyoruz ki sonrasında sonucunu kontrol edebilelim
        const response = await request.post('https://conduit-api.bondaracademy.com/api/users', {
            data: {
                user: { username: testUsername, email: testEmail, password: testPassword }
            }
        });

        // ==========================================
        // 2. DÜZELTME: DEFENSIVE ASSERTION (Savunmacı Doğrulama)
        // API gerçekten 200 veya 201 başarılı kodu döndü mü?
        // Dönmediyse test UI adımına geçmeden tam burada patlasın!
        // ==========================================
        expect(response.ok()).toBeTruthy();

        // 3. UI ETKİLEŞİMİ: Login sayfasına git ve giriş yap
        await loginPage.goto();
        await loginPage.login(testEmail, testPassword);

        // 4. Arayüz Doğrulaması
        const profileLink = page.getByRole('link', { name: testUsername });
        await expect(profileLink).toBeVisible();

        // 5. Mimari Doğrulama
        const jwtToken = await page.evaluate(() => window.localStorage.getItem('jwtToken'));
        expect(jwtToken).toBeTruthy();

        await page.waitForTimeout(2000);
    });

    test('Kayıtlı olmayan kimlik bilgileriyle girişte hata mesajı doğrulaması (Negative Test)', async ({ page }) => {
        const loginPage = new LoginPage(page);

        // 1. UI ETKİLEŞİMİ: Login sayfasına git
        await loginPage.goto();

        // 2. KASITLI HATA: Sistemde KESİNLİKLE olmayan uydurma bilgilerle giriş yapmayı dene
        // Veritabanında eşleşmeyen bir kombinasyon kullanıyoruz.
        await loginPage.login('asla_var_olmayan_biri@test.com', 'YanlisSifre123!');

        // ==========================================
        // DOĞRULAMALAR (ASSERTIONS)
        // ==========================================

        // Conduit uygulamasında hatalar genellikle '.error-messages' class'ına sahip bir liste (ul > li) içinde görünür.
        const errorList = page.locator('.error-messages li');

        // A. Görünürlük Doğrulaması: Hata mesajı kutusunun ekranda belirdiğini teyit et
        await expect(errorList).toBeVisible();

        // B. Metin İçeriği (UX) Doğrulaması: Sadece bir hata çıkması yetmez,
        // kullanıcıya "email or password is invalid" gibi doğru bir yönlendirme yapıldığını da kanıtlamalıyız.
        await expect(errorList).toContainText('email or password');

        // C. Mimari Doğrulama: Giriş başarısız olduğu için sisteme sızılamadığını,
        // yani LocalStorage'a herhangi bir 'jwtToken' YAZILMADIĞINI doğrula!
        const jwtToken = await page.evaluate(() => window.localStorage.getItem('jwtToken'));
        expect(jwtToken).toBeNull(); // Token kesinlikle null (boş) kalmalı!
    });

    test('Erişim Koruması (Route Guard): Anonim kullanıcıların yetki gerektiren sayfalara erişiminin engellenmesi', async ({ page }) => {
        // 1. KASITLI EYLEM (HACK SİMÜLASYONU):
        // Hiçbir giriş işlemi yapmadan, URL'i manipüle ederek doğrudan
        // yetki gerektiren 'Ayarlar' (Settings) sayfasına gitmeye çalışıyoruz.
        await page.goto('/settings');

        // ==========================================
        // MİMARİ DOĞRULAMALAR (ASSERTIONS)
        // ==========================================

        // A. Yönlendirme (Redirect) Kalkanı Doğrulaması:
        // Uygulamanın (Vue/React Router) bizi yakalayıp sayfaya sokmaması gerekir.
        // URL'nin kesinlikle 'settings' kelimesini İÇERMEDİĞİNİ (not) doğruluyoruz.
        await expect(page).not.toHaveURL(/.*settings/);

        // B. Güvenli Bölge Doğrulaması:
        // Yetkisiz erişim denemesinden sonra sistemin bizi güvenli bir şekilde
        // anasayfaya fırlattığını teyit ediyoruz.
        await expect(page).toHaveURL('https://conduit.bondaracademy.com/');

        // C. UI (Arayüz) Doğrulaması: Anasayfada olduğumuzu ve ekranda
        // 'Global Feed' veya 'Sign in' gibi anonim kullanıcılara özel
        // bileşenlerin çizildiğini teyit ediyoruz.
        const signInLink = page.getByRole('link', { name: 'Sign in' });
        await expect(signInLink).toBeVisible();
    });

    test('Oturum Sonlandırma (Logout): Çıkış yapıldığında token silinmeli ve arayüz anonim duruma geçmeli', async ({ page, request }) => {
        const loginPage = new LoginPage(page);

        // 1. PRE-CONDITION: Hızlıca API üzerinden kullanıcı üret
        const shortId = Date.now().toString().slice(-6);
        const testUsername = `logout_${shortId}`;
        const testEmail = `logout_${shortId}@test.com`;
        const testPassword = 'SecurePassword123!';

        await request.post('https://conduit-api.bondaracademy.com/api/users', {
            data: { user: { username: testUsername, email: testEmail, password: testPassword } }
        });

        // 2. UI ETKİLEŞİMİ: Login ol ve sisteme gir
        await loginPage.goto();
        await loginPage.login(testEmail, testPassword);

        // Sisteme girdiğimizi teyit etmek için profil adımızı bekliyoruz
        const profileLink = page.getByRole('link', { name: testUsername });
        await expect(profileLink).toBeVisible();

        // ==========================================
        // ASIL TEST BAŞLIYOR: LOGOUT İŞLEMİ
        // ==========================================

        // 3. Ayarlar (Settings) sayfasına git (Conduit'te çıkış butonu buradadır)
        await page.getByRole('link', { name: 'Settings' }).click();

        // 4. Çıkış Yap (Logout) butonuna tıkla
        // Playwright'ın harika özelliklerinden biri, kesin eşleşme ile butonu bulmasıdır.
        await page.getByRole('button', { name: 'Or click here to logout.' }).click();

        // ==========================================
        // DOĞRULAMALAR (ASSERTIONS)
        // ==========================================

        // A. Arayüz (UI) Doğrulaması: Anasayfaya yönlendirildik mi ve
        // profil ismimiz DOM'dan (ekrandan) tamamen silindi mi?
        await expect(page).toHaveURL('https://conduit.bondaracademy.com/');
        await expect(profileLink).not.toBeVisible();

        // Yeniden "Sign in" ve "Sign up" butonlarının belirdiğini teyit et
        await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

        // B. Mimari Güvenlik Doğrulaması: (En kritik adım!)
        // Tarayıcının hafızasındaki (LocalStorage) JWT Token başarıyla İMHA EDİLDİ Mİ?
        const jwtToken = await page.evaluate(() => window.localStorage.getItem('jwtToken'));
        expect(jwtToken).toBeNull(); // Çıkış sonrası token kesinlikle null dönmeli!
    });

});