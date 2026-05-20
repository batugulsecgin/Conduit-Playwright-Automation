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

});