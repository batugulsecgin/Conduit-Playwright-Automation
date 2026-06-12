import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Sosyal Etkileşimler ve State (Durum) Geçişleri', () => {

    test('Makale favorileme (Like) işleminde sayacın sayfa yenilenmeden anlık güncellenmesi', async ({ page }) => {
        const homePage = new HomePage(page);

        // 1. UI ETKİLEŞİMİ: Anasayfaya git ve 'Global Feed' sekmesine geç
        await homePage.goto();
        await homePage.globalFeedTab.click();

        // 2. Makalelerin API'den gelip DOM'a çizilmesini (render) bekle
        const firstArticle = page.locator('.article-preview').first();
        await expect(firstArticle).toBeVisible();

        // 3. İlk makalenin kalp (favorite) butonunu bul
        const favoriteButton = firstArticle.locator('button').first();

        // ==========================================
        // 4. MÜHENDİSLİK (Veri Dönüşümü ve Matematik)
        // Arayüzdeki " 0 " veya " 5 " gibi boşluklu metni okuyup,
        // JavaScript'in anlayabileceği saf bir rakama (Integer) çeviriyoruz.
        // ==========================================
        const initialText = await favoriteButton.innerText();
        const initialCount = parseInt(initialText.trim(), 10) || 0; // Eğer NaN dönerse 0 kabul et

        // Beklediğimiz yeni sayıyı matematiksel olarak hesaplıyoruz (+1)
        const expectedCount = initialCount + 1;

        // 5. AKSİYON: Butona tıkla (Makaleyi beğen)
        await favoriteButton.click();

        // ==========================================
        // 6. STATE (DURUM) DOĞRULAMASI
        // Playwright'ın 'auto-retry' (otomatik bekleme) yeteneğini kullanarak,
        // sayfa ASLA YENİLENMEDEN butonun içindeki metnin beklediğimiz yeni sayıya dönüşmesini teyit ediyoruz.
        // ==========================================
        await expect(favoriteButton).toContainText(expectedCount.toString());

        // Butonun görsel olarak da aktif duruma (renkli) geçtiğini class üzerinden doğrula
        // (Conduit uygulamasında favorilenen butonlar genellikle 'btn-primary' sınıfını alır)
        await expect(favoriteButton).toHaveClass(/btn-primary/);

        // ==========================================
        // 7. TEMİZLİK (Environment Cleanup)
        // Testin her çalıştığında aynı makaleyi tekrar tekrar beğenebilmesi için
        // (sistemin limitlerine takılmamak adına) beğeniyi geri çekiyoruz (Unlike).
        // ==========================================
        await favoriteButton.click();

        // Sayacın tekrar orijinal haline (-1) döndüğünü doğrula
        await expect(favoriteButton).toContainText(initialCount.toString());
    });

    test('Follow/Unfollow Döngüsü: Kullanıcı takibi ve durumun (state) sayfayı yenileyince korunması', async ({ page, request }) => {
        // ==========================================
        // 1. PRE-CONDITION (API ile Hedef Yazar Üretimi)
        // Her zaman takip edebileceğimiz taze bir yazar yaratıyoruz.
        // ==========================================
        const targetId = Date.now().toString().slice(-6);
        const targetUsername = `author_${targetId}`;

        await request.post('https://conduit-api.bondaracademy.com/api/users', {
            data: { user: { username: targetUsername, email: `author_${targetId}@test.com`, password: 'Password123!' } }
        });

        // 2. UI ETKİLEŞİMİ: Hedef yazarın profiline doğrudan URL (Router) ile git
        await page.goto(`/profile/${targetUsername}`);

        // ==========================================
        // 3. DİNAMİK LOCATOR TANIMLAMALARI
        // 'Unfollow' kelimesinin içindeki 'follow' kısmını yakalamaması için
        // Regex'e '\b' (Word Boundary - Kelime Sınırı) parametresini ekliyoruz!
        // ==========================================
        const followActionBtn = page.getByRole('button', { name: new RegExp(`\\bFollow ${targetUsername}`, 'i') });
        const unfollowActionBtn = page.getByRole('button', { name: new RegExp(`\\bUnfollow ${targetUsername}`, 'i') });

        // A. İlk Durum Doğrulaması: 'Follow' butonu görünür olmalı
        await expect(followActionBtn).toBeVisible();

        // ==========================================
        // 4. AKSİYON VE ANLIK STATE GEÇİŞİ
        // ==========================================
        await followActionBtn.click();

        // Sayfa YENİLENMEDEN butonun 'Unfollow'a dönüşmesi (Reactivity)
        await expect(unfollowActionBtn).toBeVisible();
        await expect(followActionBtn).not.toBeVisible();

        // ==========================================
        // 5. MİMARİ PERSISTENCE (KALICILIK) TESTİ
        // Sadece arayüzün anlık değişmesi yetmez! Verinin Backend'e ulaştığını
        // kanıtlamak için Frontend'i zorla yeniliyoruz (Hard Refresh).
        // ==========================================
        await page.reload();

        // Sayfa yeniden çizildiğinde BİLE sistem bu yazarı takip ettiğimizi hatırlamalı!
        await expect(unfollowActionBtn).toBeVisible();

        // ==========================================
        // 6. TEMİZLİK (Teardown)
        // Testin çevreyi kirletmemesi için takibi bırakıyoruz.
        // ==========================================
        await unfollowActionBtn.click();

        // Orijinal 'Follow' durumuna döndüğünü teyit et
        await expect(followActionBtn).toBeVisible();
    });

    test('Makaleye yorum ekleme ve sadece kendi yorumunda silme (Delete) yetkisine sahip olma', async ({ page }) => {
        const homePage = new HomePage(page);

        // 1. UI ETKİLEŞİMİ: Anasayfaya git ve Global Feed üzerinden ilk makaleye tıkla
        // Kendi makalemiz olmasına gerek yok, başkasının makalesine de yorum yapabiliriz.
        await homePage.goto();
        await homePage.globalFeedTab.click();

        // İlk makalenin başlığına tıklayarak detay sayfasına (Article Page) geçiş yapıyoruz
        await page.locator('.preview-link').first().click();

        // 2. YORUM EKLEME (Action)
        // Her test koşumunda yorumun benzersiz olması için zaman damgası ekliyoruz
        const uniqueComment = `Playwright POM mimarisi ile yazılmış harika bir test yorumu! ${Date.now()}`;

        await page.getByPlaceholder('Write a comment...').fill(uniqueComment);
        await page.getByRole('button', { name: 'Post Comment' }).click();

        // ==========================================
        // 3. MİMARİ VE YETKİ DOĞRULAMALARI (Assertions)
        // ==========================================

        // A. Kapsülleme (Encapsulation): Sadece bizim yazdığımız metni içeren yorum kartını (.card) buluyoruz.
        // Bu Playwright'ın en güçlü özelliklerinden biridir; diğer yorumları tamamen görmezden gelir.
        const myCommentCard = page.locator('.card', { hasText: uniqueComment });

        // Yorumumuzun DOM'a (ekrana) başarıyla eklendiğini teyit et
        await expect(myCommentCard).toBeVisible();

        // B. UI Güvenlik ve Yetki (Authorization) Doğrulaması:
        // Yorumu BİZ yazdığımız için, 'myCommentCard'ın içinde bir silme ikonu (ion-trash-a) OLMALIDIR.
        const deleteIcon = myCommentCard.locator('.ion-trash-a');
        await expect(deleteIcon).toBeVisible();

        // ==========================================
        // 4. TEMİZLİK (Teardown - Yorumu Silme)
        // ==========================================

        // Çöp kutusu ikonuna tıklayarak yorumumuzu siliyoruz
        await deleteIcon.click();

        // State Geçişi: Yorum silindikten sonra sayfa yenilenmeden DOM'dan kaybolduğunu doğrula
        await expect(myCommentCard).not.toBeVisible();
    });

});