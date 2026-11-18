import { Locator, Page } from '@playwright/test';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  birthDate: string;
  district: string;
  gender: 'Male' | 'Female';
  photoUrl: string;
}

export class CreateUserPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneNumber: Locator;
  readonly bloodGroupSelect: Locator;
  readonly passwordInput: Locator;
  readonly birthdateInput: Locator;
  readonly districtSelect: Locator;
  readonly genderSelect: Locator;
  readonly checkBoxSelect: Locator;
  readonly photoUrlInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByRole('textbox', { name: 'John', exact: true });
    this.lastNameInput = page.getByRole('textbox', { name: 'Doe' });
    this.emailInput = page.getByRole('textbox', { name: 'john@example.com' });
    this.phoneNumber = page.getByPlaceholder('01500000000');
    this.bloodGroupSelect = page.getByRole('combobox').first();
    this.passwordInput = page.getByRole('textbox', { name: 'Create a password' });
    this.birthdateInput = page.getByPlaceholder('MM/dd/yyyy');
    this.districtSelect = page.getByRole('combobox').nth(1);
    this.genderSelect = page.getByRole('radio', { name: 'Male', exact: true });
    this.checkBoxSelect = page.getByRole('checkbox', { name: 'I confirm this user registration' });
    this.photoUrlInput = page.locator('#photoInput');
  }

  async CreateUser(user: UserData) {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.phoneNumber.fill(user.phoneNumber);

    await this.bloodGroupSelect.click();
    await this.bloodGroupSelect.press('ArrowDown');
    await this.bloodGroupSelect.press('Enter');

    await this.passwordInput.fill(user.password);

    await this.birthdateInput.click();
    await this.birthdateInput.selectText();
    await this.birthdateInput.press('Backspace');
    await this.birthdateInput.pressSequentially(user.birthDate, { delay: 150 });
    await this.birthdateInput.press('Enter');

    await this.districtSelect.selectOption(user.district);
    await this.page.getByRole('radio', { name: user.gender, exact: true }).check();
    await this.checkBoxSelect.check();
    await this.photoUrlInput.setInputFiles(user.photoUrl);
    await this.page.getByRole('button', { name: 'Create User' }).click();
  }

  async createUser(user: UserData) {
    await this.CreateUser(user);
  }
}
