import { test as setup, expect } from '@playwright/test';

// Oturum bilgisinin kaydedileceği dosya yolu
const authFile = '.auth/user.json';

setup('Global Authentication - Yeni Kullanıcı Kaydı ve Session Kaydetme', async ({ page }) => {
    // Rastgele ve benzersiz bir kullanıcı adı ve e-posta üretiyoruz
    const uniqueId = Date.now();
    const username = `user_${uniqueId}`;
    const email = `playwright_${uniqueId}@example.com`;
    const password = 'TestPassword123!';

    // Kayıt sayfasına git
    await page.goto('/register');

    // Form elemanlarını doldur (Playwright'ın güçlü locator yapılarını kullanıyoruz)
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);

    // Sign up butonuna tıkla
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Anasayfaya başarıyla yönlendiğimizi ve kullanıcının profil adının göründüğünü doğrula
    // Conduit sitesinde giriş yapılınca sağ üstte kullanıcı adı belirir
    await expect(page.getByRole('link', { name: username })).toBeVisible({ timeout: 10000 });

    // Tüm tarayıcı durumunu (cookies, localStorage, token) JSON dosyasına döküyoruz
    await page.context().storageState({ path: authFile });
});