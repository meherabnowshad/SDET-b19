const {test, expect} = require('@playwright/test');

test('LocateMultipleElements', async({page}) =>{
    await page.goto('https://demoblaze.com/index.html')

    const productLocator = page.locator("//div[@id='tbodyid']//h4/a");
    await productLocator.first().waitFor();

    const products = await productLocator.all();

    for (const product of products) {
        const prodName = await product.textContent();
        console.log(prodName);
    }
})