import {test, expect} from '@playwright/test'

test('Locators', async(page) => {
    await page.locator("https://demoblaze.com/index.html")

    await page.locator('id=login2').click()

    await page.locator('#loginusername').fill('pavanol')

    await page.locator('#loginpassword').fill('test@123')

    await page.locator("//button[normalize-space()='Log in']")

    const logoutlink = await page.locator("//a[@id='logout2']")

    await expect(logoutlink).toBeVisible();

    await page.close()
})