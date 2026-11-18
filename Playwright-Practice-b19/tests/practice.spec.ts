import {test, expect} from '@playwright/test';

test("User login", async({page})=>{
    await page.goto("");  

    await page.getByRole("textbox", {name:"you@example.com"}).fill("admin@test.com");
    await page.getByRole("textbox",{name: "Enter password"}).fill("1234");

    await page.getByRole("button", {name:"Login"}).click();

    const profileHeader=  await page.getByRole("heading",{name:"Profile"}).textContent();
    await expect(profileHeader?.includes("Profile"));

    await expect(page.getByRole('heading')).toContainText('Profile');

    await page.context().storageState({path:"auth.json"});

    // await page.pause();
 

})

test("Button Click", async({page})=>{
    await page.goto("/dashboard/practice-components");
    await page.getByRole("button", {name:"Double Click Me"}).dblclick();
    await page.pause();
})


test.only("Open new tab handling", async({page, context})=>{
    await page.goto("/dashboard/practice-components");
    await page.getByRole("button", {name:"Double Click Me"}).dblclick();
    const newPagePromise = context.waitForEvent('page');
    await page.getByRole("button", {name:"Open New Tab"}).click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    console.log(newPage.url());
    expect(newPage.url()).toContain("example.com");
    await newPage.close();``
    
})