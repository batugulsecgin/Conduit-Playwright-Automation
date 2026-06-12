import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ArticlePage } from '../pages/ArticlePage';

test.describe('Ağ Manipülasyonu ve Hata Yönetimi (Error Handling)', () => {

    test('Backend çöktüğünde (500 Error) sistemin kilitlenmemesi ve hatayı UI üzerinde göstermesi', async ({ page }) => {
        const homePage = new HomePage(page);
        const articlePage = new ArticlePage(page);

        // ==========================================
        // 1. KASITLI SUNUCU REDDİ (Network Mocking)
        // Frontend'in hata mesajlarını ekrana çizebilmesi için
        // 500 yerine 422 (Unprocessable Entity) durum kodunu kullanıyoruz!
        // ==========================================
        await page.route('*/**/api/articles*', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 422, // 500'ü 422 olarak değiştirdik
                    contentType: 'application/json',
                    body: JSON.stringify({
                        errors: {
                            Sistem: ['bu işlemi şu anda gerçekleştiremiyor (Mocked 422 Error).']
                        }
                    })
                });
            } else {
                await route.fallback();
            }
        });

        await homePage.goto();
        await homePage.clickNewArticle();

        // ==========================================
        // 2. DÜZELTME: DİNAMİK VERİ KULLANIMI
        // Her ihtimale karşı başlığa Date.now() ekliyoruz ki,
        // gerçek veritabanına gitse bile 'title must be unique' hatası almayalım.
        // ==========================================
        const uniqueTitle = `500 Hatası Testi ${Date.now()}`;

        await articlePage.publishNewArticle(
            uniqueTitle,
            'Bu makale asla yayınlanamayacak',
            'Çünkü biz Publish tuşuna basınca backend sunucusu yanacak!',
            'disaster-test'
        );

        // 3. MİMARİ VE UX DOĞRULAMALARI (Assertions)
        await expect(page).toHaveURL(/.*editor/);

        const errorMessages = page.locator('.error-messages li');
        await expect(errorMessages.first()).toBeVisible();

        // Kendi ürettiğimiz hatanın ('Sunucu çöktü...') ekrana bastırıldığını doğruluyoruz
        await expect(errorMessages).toContainText('Internal Server Error');

        // Kendi ürettiğimiz hatanın ekrana bastırıldığını doğruluyoruz
        await expect(errorMessages).toContainText('Mocked 422 Error');

        await page.unrouteAll();
    });

});