import { test, expect } from "@playwright/test";
import { BrowserContext, Page } from "@playwright/test";
import { suiteTeardown } from "mocha";
import { SUITES } from "../utils/suites";

let browserContext: BrowserContext;
let page: Page;

test.describe("Practice Autoamation", () => {
    test.describe.configure({mode:"serial"})      
    test.beforeAll(async ({ browser }) => {
    browserContext = await browser.newContext({ storageState: 'auth.json' });
    page = await browserContext.newPage();
    });

    test.afterAll(async () => {
    await browserContext.close();
    });


    test("Visit Practice Site",{tag:SUITES.smoke}, async () => {
    await page.goto('http://localhost:3000/dashboard/practice-components');
    });

    test('Button Click',{tag:SUITES.smoke}, async () => {
    await expect(page.getByRole('heading', { name: 'Practice Components' })).toBeVisible();

    let alertMessage = '';
    page.once('dialog', async (dialog) => {
    alertMessage = dialog.message();
    await dialog.accept();
    });

    await page.getByRole('button', { name: 'Double Click Me' }).dblclick();
    expect(alertMessage).toBe('double clicked!');
    });

    test('Open new tab', async () => {
    const [newPage] = await Promise.all([
    browserContext.waitForEvent('page'),
    page.getByRole('button', { name: 'Open New Tab' }).click(),
    ]);

    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('example.com');
    });

    test('Open new Window', async () => {
    const [newPage] = await Promise.all([
    browserContext.waitForEvent('page'),
    page.getByRole('button', { name: 'Open New Window' }).click(),
    ]);

    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('example.com');
    await newPage.close()
    await page.pause()
    });
    test("NextJS Datetime input", async ({}) => {
    await page.goto("http://localhost:3000/dashboard/practice-components");
    await page.locator("[type=datetime-local]").fill('2025-08-01T18:30');
    // await page.pause();
    })

    test("react DatePicker", async ({}) => {
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

  
});

