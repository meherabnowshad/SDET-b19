const { chromium } = require('@playwright/test');

module.exports = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'you@example.com' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Enter password' }).fill('1234');
  await page.getByRole('button', { name: 'login' }).click();

  await page.waitForURL('**/profile');
  await context.storageState({ path: 'auth.json' });
  await browser.close();
};
