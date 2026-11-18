import {test, expect} from '@playwright/test';
test("Go to dashboard", async({page})=>{
    await page.goto("http://localhost:3000/dashboard/practice-components")
})