import puppeteer from "puppeteer";
import xlsx from "xlsx";

(async () => {

    const URL = "https://www.amazon.com";
    const browser = await puppeteer.launch({
        headless:false,
    });
    const page = await browser.newPage();

    await page.goto(URL, {
        waitUntil: "networkidle2"
    });
    let products:any = [];
    let nextPage = true;

    while(nextPage){
        const newProductsList = await page.evaluate(() => {
            const products = Array.from(document.querySelectorAll('.puis-card-container.s-card-container'));    

            return products.map(product => {
                const productName = product.querySelector('.a-text-normal')?.textContent;
                const priceWhole = product.querySelector('.a-price-whole')?.textContent;
                const priceFraction = product.querySelector('.a-price-fraction')?.textContent;
                const productNameCleaned = productName?.trim();

                if(!priceWhole || !priceFraction){
                    return {
                        productNameCleaned,
                        price: "N/A"
                    }
                };

                return {
                    productNameCleaned,
                    price: `${priceWhole}${priceFraction}`
                };
            });
        });

        products = [...products, ...newProductsList];
        
        nextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('.s-pagination-next') as HTMLElement;
            if(nextButton && !nextButton.classList.contains('s-pagination-disabled')) {
                nextButton.click()
                return true;
            }
            return false;
        });

        await new Promise((resolve) => setTimeout(resolve, 5000));

    }
    
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(products);
    const path = "products.xlsx";
    xlsx.utils.book_append_sheet(wb, ws, "Products");
    xlsx.writeFile(wb, path);

    await browser.close();
})()