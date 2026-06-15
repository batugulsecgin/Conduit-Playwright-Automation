import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ArticlePage } from '../pages/ArticlePage';

// Harici JSON veri dosyamızı içeri aktarıyoruz
// Bazı projelerde TypeScript'in `resolveJsonModule` kapalı olabilir,
// bu yüzden doğrudan `require` ile runtime'da yükleyerek hataları önlüyoruz.
// eslint ve TS-izin uyarıları için gerekli satırı ekliyoruz.
// declare `require` in case project doesn't include Node types
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const registerTestData = require('../test-data/registerErrors.json');

// ==========================================
// 1. MAKALE FORMU İÇİN DAHİLİ VERİ SETİ (Internal Array)
// ==========================================
const articleTestScenarios = [
    {
        missingField: 'Başlık (Title)',
        title: '',
        description: 'Harika bir makale açıklaması',
        body: 'Makalenin içeriği burada yer alıyor.',
        expectedError: "title can't be blank"
    },
    {
        missingField: 'Açıklama (Description)',
        title: `DDT Testi ${Date.now()}`,
        description: '',
        body: 'Makalenin içeriği burada yer alıyor.',
        expectedError: "description can't be blank"
    },
    {
        missingField: 'İçerik (Body)',
        title: `DDT Testi ${Date.now()}`,
        description: 'Harika bir makale açıklaması',
        body: '',
        expectedError: "body can't be blank"
    }
];

// ==========================================
// BLOK A: Dahili Dizi Kullanarak Makale Validasyonları
// ==========================================
test.describe('DDT Modülü - Makale Validasyonları (Dahili Dizi)', () => {

    for (const scenario of articleTestScenarios) {
        test(`Negatif Test: ${scenario.missingField} alanı eksik bırakıldığında sistem hata vermelidir`, async ({ page }) => {
            const homePage = new HomePage(page);
            const articlePage = new ArticlePage(page);

            // Yeni makale sayfasına yönlen
            await homePage.goto();
            await homePage.clickNewArticle();

            // Formu dinamik senaryo verisiyle doldur
            await articlePage.publishNewArticle(
                scenario.title,
                scenario.description,
                scenario.body,
                'ddt-test'
            );

            // Hata mesajını doğrula
            const errorMessages = page.locator('.error-messages li');
            await expect(errorMessages).toContainText(scenario.expectedError);
        });
    }

});

// ==========================================
// BLOK B: Harici JSON Dosyası Kullanarak Kayıt Validasyonları
// ==========================================
test.describe('DDT Modülü - Kayıt Validasyonları (Harici JSON)', () => {

    for (const data of registerTestData) {
        test(`Kayıt Validasyonu: ${data.testName}`, async ({ page }) => {

            // Kayıt sayfasına git
            await page.goto('/register');

            // Form elemanlarını JSON'dan gelen verilerle doldur
            await page.getByPlaceholder('Username').fill(data.username);
            await page.getByPlaceholder('Email').fill(data.email);
            await page.getByPlaceholder('Password').fill(data.password);

            // Gönder butonuna tıkla
            await page.getByRole('button', { name: 'Sign up' }).click();

            // UI üzerinde beklenen hata mesajının belirdiğini teyit et
            const errorMessages = page.locator('.error-messages li');
            await expect(errorMessages).toContainText(data.expectedError);
        });
    }

});