import { Page, Locator } from '@playwright/test';

export class HomePage {
    readonly page: Page;
    readonly newArticleLink: Locator;
    readonly profileLink: Locator;
    readonly globalFeedTab: Locator;

    constructor(page: Page) {
        this.page = page;
        // Playwright'ın güçlü 'getByRole' ve 'getByText' locator'larını kullanıyoruz
        this.newArticleLink = page.getByRole('link', { name: 'New Article' });
        this.profileLink = page.getByRole('link', { name: 'Profile' });

        // YENİ HALİ: (Rol aramıyoruz, direkt metni arıyoruz)
        this.globalFeedTab = page.getByText('Global Feed', { exact: true });
        // ESKİ HALİ:
        // this.globalFeedTab = page.getByRole('button', { name: 'Global Feed' });
    }

    async goto() {
        await this.page.goto('/');
    }

    async clickNewArticle() {
        await this.newArticleLink.click();
    }
}