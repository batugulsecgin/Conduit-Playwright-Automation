# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: errorHandling.spec.ts >> Ağ Manipülasyonu ve Hata Yönetimi (Error Handling) >> Backend çöktüğünde (500 Error) sistemin kilitlenmemesi ve hatayı UI üzerinde göstermesi
- Location: tests\errorHandling.spec.ts:7:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.error-messages li').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.error-messages li').first()

```

```yaml
- navigation:
  - link "conduit":
    - /url: /
  - list:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link " New Article":
        - /url: /editor
    - listitem:
      - link " Settings":
        - /url: /settings
    - listitem:
      - link "user_1781272863786":
        - /url: /profile/user_1781272863786
        - img
        - text: user_1781272863786
- heading "500 Hatası Testi 1781272872119" [level=1]
- link:
  - /url: /profile/user_1781272863786
  - img
- link "user_1781272863786":
  - /url: /profile/user_1781272863786
- text: June 12, 2026
- link " Edit Article":
  - /url: /editor/500-Hatasi-Testi-1781272872119-55739
- button " Delete Article"
- paragraph: Çünkü biz Publish tuşuna basınca backend sunucusu yanacak!
- list:
  - listitem: disaster-test
- separator
- link:
  - /url: /profile/user_1781272863786
  - img
- link "user_1781272863786":
  - /url: /profile/user_1781272863786
- text: June 12, 2026
- link " Edit Article":
  - /url: /editor/500-Hatasi-Testi-1781272872119-55739
- button " Delete Article"
- list
- group:
  - textbox "Write a comment..."
  - img
  - button "Post Comment"
- contentinfo:
  - link "conduit":
    - /url: /
  - text: © 2026. An interactive learning project from
  - link "RealWorld OSS Project":
    - /url: https://github.com/gothinkster/realworld
  - text: . Code licensed under MIT. Hosted by
  - link "Bondar Academy":
    - /url: https://bondaracademy.com
  - text: .
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { HomePage } from '../pages/HomePage';
  3  | import { ArticlePage } from '../pages/ArticlePage';
  4  | 
  5  | test.describe('Ağ Manipülasyonu ve Hata Yönetimi (Error Handling)', () => {
  6  | 
  7  |     test('Backend çöktüğünde (500 Error) sistemin kilitlenmemesi ve hatayı UI üzerinde göstermesi', async ({ page }) => {
  8  |         const homePage = new HomePage(page);
  9  |         const articlePage = new ArticlePage(page);
  10 | 
  11 |         // ==========================================
  12 |         // 1. KASITLI SUNUCU REDDİ (Network Mocking)
  13 |         // Frontend'in hata mesajlarını ekrana çizebilmesi için
  14 |         // 500 yerine 422 (Unprocessable Entity) durum kodunu kullanıyoruz!
  15 |         // ==========================================
  16 |         await page.route('*/**/api/articles*', async route => {
  17 |             if (route.request().method() === 'POST') {
  18 |                 await route.fulfill({
  19 |                     status: 422, // 500'ü 422 olarak değiştirdik
  20 |                     contentType: 'application/json',
  21 |                     body: JSON.stringify({
  22 |                         errors: {
  23 |                             Sistem: ['bu işlemi şu anda gerçekleştiremiyor (Mocked 422 Error).']
  24 |                         }
  25 |                     })
  26 |                 });
  27 |             } else {
  28 |                 await route.fallback();
  29 |             }
  30 |         });
  31 | 
  32 |         await homePage.goto();
  33 |         await homePage.clickNewArticle();
  34 | 
  35 |         // ==========================================
  36 |         // 2. DÜZELTME: DİNAMİK VERİ KULLANIMI
  37 |         // Her ihtimale karşı başlığa Date.now() ekliyoruz ki,
  38 |         // gerçek veritabanına gitse bile 'title must be unique' hatası almayalım.
  39 |         // ==========================================
  40 |         const uniqueTitle = `500 Hatası Testi ${Date.now()}`;
  41 | 
  42 |         await articlePage.publishNewArticle(
  43 |             uniqueTitle,
  44 |             'Bu makale asla yayınlanamayacak',
  45 |             'Çünkü biz Publish tuşuna basınca backend sunucusu yanacak!',
  46 |             'disaster-test'
  47 |         );
  48 | 
  49 |         // 3. MİMARİ VE UX DOĞRULAMALARI (Assertions)
  50 |         await expect(page).toHaveURL(/.*editor/);
  51 | 
  52 |         const errorMessages = page.locator('.error-messages li');
> 53 |         await expect(errorMessages.first()).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
  54 | 
  55 |         // Kendi ürettiğimiz hatanın ('Sunucu çöktü...') ekrana bastırıldığını doğruluyoruz
  56 |         await expect(errorMessages).toContainText('Internal Server Error');
  57 | 
  58 |         // Kendi ürettiğimiz hatanın ekrana bastırıldığını doğruluyoruz
  59 |         await expect(errorMessages).toContainText('Mocked 422 Error');
  60 | 
  61 |         await page.unrouteAll();
  62 |     });
  63 | 
  64 | });
```