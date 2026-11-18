import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.pom';

test('User login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('admin@test.com', '1234');
    await expect(loginPage.profileHeading).toBeVisible();
    await loginPage.saveAuthState('auth.json');
});

test("Button Click",async({page})=>{
    await page.goto("http://localhost:3000/dashboard/practice-components");
    await expect(page.getByRole('heading', { name: 'Practice Components' })).toBeVisible();
    let alertMessage = '';
    page.once('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
    });
    await page.getByRole('button', { name: 'Double Click Me' }).dblclick();
    expect(alertMessage).toBe('double clicked!');
    // await page.pause()
})

test("Open new tab", async({page, context})=>{
    await page.goto("http://localhost:3000/dashboard/practice-components");
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('button', {name: "Open New Tab"}).click()
    ]);
    await newPage.waitForLoadState();
    console.log(newPage.url());
    expect(newPage.url()).toContain("example.com");
    // await newPage.pause();
});

test("Open new Window", async({page, context})=>{
    await page.goto("http://localhost:3000/dashboard/practice-components");
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page.getByRole('button', {name: "Open New Window"}).click()
    ]);
    await newPage.waitForLoadState();
    console.log(newPage.url());
    expect(newPage.url()).toContain("example.com");
    // await newPage.pause();
});

test("Open Modal", async({page})=>{
    await page.goto("http://localhost:3000/dashboard/practice-components");
    await page.locator("#openModalBtn").click();
    const modal = await page.getByRole("dialog");
    await expect(modal).toBeVisible();
    const modalText = await modal.textContent();
    console.log(modalText);
    await page.getByRole("button",{name:"Close"}).first().click();
    await expect(modal).not.toBeVisible();
    // await page.pause();
})


test("NextJS Datetime input", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/practice-components");
    await page.locator("[type=datetime-local]").fill('2025-08-01T18:30');
    // await page.pause();
})

test("react DatePicker", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/practice-components");
    const dateElem = page.locator('input[readonly]').first();
    const value = await dateElem.evaluate((el) => {
        el.removeAttribute('readonly');
        el.value = "2026-01-01";
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return el.value;
    });
    expect(value).toBe('2026-01-01');

    // await page.pause();
});

test("React DatePicker", async({page})=>{
    await page.goto("http://localhost:3000/dashboard/practice-components");
    const reactDatePicker = page.getByPlaceholder('Select date');
    await reactDatePicker.click();
    await reactDatePicker.fill('08/15/2026');
    await page.keyboard.press('Enter');
    console.log(reactDatePicker.inputValue());
    // await page.pause();

})

test("Handle iFrame", async({page})=>{
    await page.goto('http://localhost:3000/dashboard/practice-components');
    const frame = page.frameLocator('iframe');
    await frame.getByRole("textbox",{name:"you@example.com"}).fill('admin@test.com');
    await frame.getByRole("textbox",{name:"Enter password"}).fill('1234');
    await frame.getByRole("button",{name:"Login"}).click();
    // await page.pause()
    
})