import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Akış Algoritmaları ve Filtreleme (Feed & Pagination)', () => {

    test('Popüler etiketlere tıklandığında akışın (feed) doğru filtrelenmesi', async ({ page }) => {
        const homePage = new HomePage(page);

        // 1. Anasayfaya git
        await homePage.goto();

        // 2. DİNAMİK VERİ OKUMA
        const firstTagLocator = page.locator('.sidebar .tag-list a').first();
        await expect(firstTagLocator).toBeVisible();
        const selectedTagText = (await firstTagLocator.innerText()).trim();

        // ==========================================
        // 3. AKSİYON VE SENKRONİZASYON (Race Condition Çözümü)
        // Playwright'ın API hızını geçmesini engelliyoruz.
        // ==========================================

        // A. Tıklamadan hemen önce, arka planda yapılacak API isteğini dinlemeye alıyoruz
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/api/articles') && response.status() === 200
        );

        // B. Aksiyonu (Tıklamayı) gerçekleştir
        await firstTagLocator.click();

        // C. Yeni makalelerin Backend'den başarıyla dönmesini (Promise) bekle
        await responsePromise;

        // D. (Opsiyonel ama güçlü) UI'ın kendisini toparlaması için 'Loading...' yazısının kaybolmasını bekle
        await expect(page.locator('.article-preview', { hasText: 'Loading articles...' })).not.toBeVisible();

        // ==========================================
        // 4. MİMARİ VE ALGORİTMA DOĞRULAMALARI
        // ==========================================

        const activeFeedTab = page.locator('.feed-toggle .nav-link.active');
        await expect(activeFeedTab).toHaveText(selectedTagText);

        const articlePreviews = page.locator('.article-preview');
        await expect(articlePreviews.first()).toBeVisible();

        const articleCount = await articlePreviews.count();

        // Döngüsel Kontrol (Artık güvenle yeni DOM'u okuyabiliriz)
        for (let i = 0; i < articleCount; i++) {
            const articleTags = articlePreviews.nth(i).locator('.tag-list li');
            const tagTexts = await articleTags.allInnerTexts();
            const cleanedTagTexts = tagTexts.map(t => t.trim());

            expect(cleanedTagTexts).toContain(selectedTagText);
        }
    });

    test('Sayfalama (Pagination) işlemi ve API offset hesaplamasının ağ katmanında doğrulanması', async ({ page }) => {
        const homePage = new HomePage(page);

        // ==========================================
        // 1. MİMARİ MÜDAHALE (Data Mocking / Interception)
        // Veritabanında yeterli makale yoksa '2' butonu çıkmaz.
        // Frontend'i kandırmak için API cevabını havada değiştiriyoruz!
        // ==========================================
        await page.route('*/**/api/articles*', async route => {
            const response = await route.fetch(); // Backend'den gelen gerçek cevabı al
            const json = await response.json();   // JSON formatına çevir

            // Gerçek makalelere dokunmuyoruz, SADECE toplam sayıyı manipüle ediyoruz
            json.articlesCount = 500;

            // Değiştirilmiş yalan veriyi Frontend'e teslim et
            await route.fulfill({ response, json });
        });

        // 2. UI ETKİLEŞİMİ: Anasayfaya git ve Global Feed'e geç
        await homePage.goto();
        await homePage.globalFeedTab.click();

        // Makalelerin API'den gelip DOM'a çizilmesini bekle
        await expect(page.locator('.article-preview').first()).toBeVisible();

        // 3. SAYFALAMA KONTROLÜ
        const paginationList = page.locator('.pagination');

        // ESKİ (Hatalı) HALİ: İçinde 2 geçen her şeyi (12, 20, 21) buluyordu
        // const pageTwoButton = paginationList.locator('.page-item').filter({ hasText: '2' }).locator('.page-link');

        // YENİ (Doğru ve Clean) HALİ: Tam ve kesin (exact) eşleşme arıyoruz
        const pageTwoButton = paginationList.getByRole('button', { name: '2', exact: true });

        // Artık sistemde 500 makale varmış gibi davrandığı için bu buton KESİNLİKLE görünür olacak!
        await expect(pageTwoButton).toBeVisible();

        // ==========================================
        // 4. MİMARİ DOĞRULAMA (Network Request Interception)
        // ==========================================
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/articles') &&
            request.url().includes('offset=10') &&
            request.method() === 'GET'
        );

        // AKSİYON: 2. Sayfaya tıkla
        await pageTwoButton.click();

        // Beklediğimiz offset=10 parametresine sahip isteğin tarayıcıdan çıktığını kanıtla
        const request = await requestPromise;
        expect(request).toBeTruthy();

        // 5. UI (Arayüz) DOĞRULAMALARI
        const activePage = paginationList.locator('.page-item.active');
        await expect(activePage).toHaveText('2');
        await expect(page.locator('.article-preview').first()).toBeVisible();

        // ==========================================
        // 6. TEARDOWN (Güvenli Kapanış)
        // Test başarıyla bitti. Tarayıcı kapanırken havada kalan (in-flight)
        // son saniye API isteklerinin testin sonucunu bozmasını engelliyoruz.
        // ==========================================
        await page.unrouteAll({ behavior: 'ignoreErrors' });
    });

});