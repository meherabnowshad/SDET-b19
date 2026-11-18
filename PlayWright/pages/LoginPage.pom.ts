import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly profileHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'you@example.com' });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter password' });
    this.loginButton = page.getByRole('button', { name: 'login' });
    this.profileHeading = page.getByRole('heading', { name: 'Profile' });
  }

  async gotoLoginPage() {
    await this.page.goto('http://localhost:3000/');
  }

  async login(email: string, password: string) {
    await this.gotoLoginPage();
    await this.page.waitForTimeout(200);
    await this.emailInput.fill(email, { delay: 120 });
    await this.page.waitForTimeout(200);
    await this.passwordInput.fill(password, { delay: 120 });
    await this.page.waitForTimeout(200);
    await this.loginButton.click();
    await this.page.waitForTimeout(300);
    await this.profileHeading.waitFor({ state: 'visible' });
  }

  async saveAuthState(path = 'auth.json') {
    await this.page.context().storageState({ path });
  }
}
