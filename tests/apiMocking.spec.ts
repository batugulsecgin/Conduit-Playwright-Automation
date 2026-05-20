import { test, expect } from '@playwright/test';

test.describe('Network Interception & Mocking', () => {

    test('Veritabanında olmayan sahte bir makaleyi anasayfada gösterme', async ({ page }) => {

        // 1. ADIM: Araya Girme (Interception)
        // Tarayıcı içinde 'api/articles' geçen herhangi bir istek yapmaya kalktığında onu durduruyoruz.
        await page.route('*/**/api/articles*', async route => {

            // 2. ADIM: Sahte (Mock) Veriyi Hazırlama
            // Conduit API'sinin beklediği formatta sahte bir JSON objesi yaratıyoruz.
            const mockResponse = {
                articles: [
                    {
                        title: "Playwright ile Hacklenmiş Makale 🚀",
                        slug: "playwright-hack",
                        body: "Bu makale aslında veritabanında yok! Sadece senin tarayıcında, ağ isteği havada değiştirilerek oluşturuldu.",
                        createdAt: "2026-05-20T12:00:00.000Z",
                        updatedAt: "2026-05-20T12:00:00.000Z",
                        tagList: ["qa-magic", "playwright", "mocking"],
                        description: "Network Interception Testi",
                        author: {
                            username: "Matrix_Batu", // Yazarı kendimiz belirliyoruz!
                            bio: "Automation Expert",
                            image: "https://api.realworld.io/images/smiley-cyrus.jpeg",
                            following: false
                        },
                        favorited: false,
                        favoritesCount: 9999 // Ekranda 9999 beğeni görünecek
                    }
                ],
                articlesCount: 1
            };

            // 3. ADIM: İsteği sahte veri ile cevapla (Fulfill)
            await route.fulfill({
                status: 200, // Başarılı HTTP kodu
                contentType: 'application/json',
                json: mockResponse
            });
        });

        // 4. ADIM: Anasayfaya Git
        // Sayfa yüklendiğinde tarayıcı makaleleri isteyecek ama bizim yazdığımız route devreye girecek!
        await page.goto('/');

        // 5. ADIM: Doğrulama
        // Yarattığımız sahte makalenin başlığının ekranda göründüğünü teyit ediyoruz.
        const mockArticleTitle = page.getByRole('heading', { name: 'Playwright ile Hacklenmiş Makale 🚀' });
        await expect(mockArticleTitle).toBeVisible();

        // 9999 beğeninin ekrana yansıyıp yansımadığını kontrol ediyoruz
        const fakeLikes = page.getByText('9999');
        await expect(fakeLikes).toBeVisible();

        // Ekranda doya doya görebilmek için testi 3 saniyeliğine duraklatıyoruz (Normalde testlerde kullanılmaz, sadece izlemek içindir)
        await page.waitForTimeout(3000);
    });

});