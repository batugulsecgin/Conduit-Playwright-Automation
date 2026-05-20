import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */

  use: {
    /* Eski çalışmayan URL yerine, otomasyon için özel hazırlanmış stabil URL'i yazıyoruz */
    baseURL: 'https://conduit.bondaracademy.com',

    headless: false,
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // 1. Önce Çalışacak Setup Projesi
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Standart Tarayıcılar (Setup projesine bağımlı hale getiriyoruz)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Her testin otomatik olarak bu oturum bilgisini kullanmasını sağlıyoruz
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'], // Setup bitmeden bu projeyi başlatma diyoruz
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
