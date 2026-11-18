import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { generateRandomNumber } from '../utils/randomNujmbers';
import { CreateUserPage, UserData } from '../pages/CreatedUserPage.pom';

const slowDelay = 200;

test.use({ storageState: 'auth.json' });

test.beforeEach(async ({ page }) => {
  await page.waitForTimeout(slowDelay);
});

test.skip('Add new user', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/add-user');
  await page.waitForTimeout(slowDelay);
  await page.getByRole('textbox', { name: 'John', exact: true }).fill('Test', { delay: 120 });
  await page.waitForTimeout(slowDelay);
  await page.getByRole('textbox', { name: 'Doe' }).fill('User 1', { delay: 120 });

  const email = faker.internet.email();
  await page.waitForTimeout(slowDelay);
  await page.getByRole('textbox', { name: 'john@example.com' }).fill(email, { delay: 120 });

  const phoneNumber = `01${generateRandomNumber(100000000, 999999999)}`;
  await page.waitForTimeout(slowDelay);
  await page.getByPlaceholder('01500000000').fill(phoneNumber, { delay: 120 });

  const bloodGroup = page.getByRole('combobox').first();
  await page.waitForTimeout(slowDelay);
  await bloodGroup.click();
  await bloodGroup.press('ArrowDown');
  await bloodGroup.press('Enter');

  await page.waitForTimeout(slowDelay);
  await page.getByRole('textbox', { name: 'Create a password' }).fill('1234', { delay: 120 });

  const txtBirthDate = page.getByPlaceholder('MM/dd/yyyy');
  await page.waitForTimeout(slowDelay);
  await txtBirthDate.click();
  await txtBirthDate.selectText();
  await txtBirthDate.press('Backspace');
  await txtBirthDate.pressSequentially('01/01/2025', { delay: 150 });
  await txtBirthDate.press('Enter');

  await page.waitForTimeout(slowDelay);
  await page.getByRole('combobox').nth(1).selectOption('Dhaka');
  await page.waitForTimeout(slowDelay);
  await page.getByRole('radio', { name: 'Male', exact: true }).check();
  await page.waitForTimeout(slowDelay);
  await page.getByRole('checkbox', { name: 'I confirm this user registration' }).check();
  await page.waitForTimeout(slowDelay);
  await page.locator('#photoInput').setInputFiles('resources/hardy.png');
  await page.waitForTimeout(slowDelay);
  await page.getByRole('button', { name: 'Create User' }).click();
});

test('Create New User', async ({ page }) => {
  const createUserPage = new CreateUserPage(page);
  await page.goto('http://localhost:3000/dashboard/add-user');
  await page.waitForTimeout(slowDelay);

  const user: UserData = {
    firstName: 'Test',
    lastName: 'User',
    email: faker.internet.email(),
    phoneNumber: `01${generateRandomNumber(100000000, 999999999)}`,
    password: '1234',
    birthDate: '01/01/2025',
    district: 'Dhaka',
    gender: 'Male',
    photoUrl: 'resources/hardy.png'
  };

  await createUserPage.createUser(user);
  await page.waitForTimeout(slowDelay);
  await expect(page).toHaveURL('http://localhost:3000/dashboard/users');
});
