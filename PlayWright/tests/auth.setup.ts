import {test as setup} from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.pom';

const authFile = 'auth.json';

setup('authenticate', async ({page})=> {
    const loginPage = new LoginPage(page);
    await page.waitForTimeout(200);
    await loginPage.login('admnin@test.com', '1234');
    await page.waitForTimeout(300);
    await page.context().storageState({path:authFile});
})