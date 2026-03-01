const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:4200/demo/dashboard', { waitUntil: 'networkidle0' });

    const styles = await page.evaluate(() => {
        const body = document.body;
        const bodyStyles = window.getComputedStyle(body);

        const nav = document.querySelector('nav');
        const navStyles = nav ? window.getComputedStyle(nav) : null;

        return {
            bodyBg: bodyStyles.backgroundColor,
            bodyBgImg: bodyStyles.backgroundImage,
            bodyCanvasVar: bodyStyles.getPropertyValue('--color-bg-canvas'),
            navBg: navStyles ? navStyles.backgroundColor : null,
        };
    });

    console.log(JSON.stringify(styles, null, 2));
    await browser.close();
})();
