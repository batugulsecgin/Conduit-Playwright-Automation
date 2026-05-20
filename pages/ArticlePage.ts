import { Page, Locator, expect } from '@playwright/test';

export class ArticlePage {
    readonly page: Page;
    readonly titleInput: Locator;
    readonly descriptionInput: Locator;
    readonly bodyInput: Locator;
    readonly tagsInput: Locator;
    readonly publishButton: Locator;
    readonly deleteButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.titleInput = page.getByPlaceholder('Article Title');
        this.descriptionInput = page.getByPlaceholder('What\'s this article about?');
        this.bodyInput = page.getByPlaceholder('Write your article (in markdown)');
        this.tagsInput = page.getByPlaceholder('Enter tags');
        this.publishButton = page.getByRole('button', { name: 'Publish Article' });

        // Bir makaleyi açtığımızda yazarı bizsek sayfada silme butonu çıkar
        this.deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    }

    // Makale oluşturma işlemini tek bir fonksiyonda (Clean Code) topluyoruz
    async publishNewArticle(title: string, description: string, body: string, tag: string) {
        await this.titleInput.fill(title);
        await this.descriptionInput.fill(description);
        await this.bodyInput.fill(body);
        await this.tagsInput.fill(tag);
        // Playwright enter tuşuna basmayı simüle edebilir
        await this.tagsInput.press('Enter');
        await this.publishButton.click();
    }
}