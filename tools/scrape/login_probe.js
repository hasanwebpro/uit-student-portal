const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto('https://eduboard.uit.edu/StudentPortal/Login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/login_desktop.png`, fullPage: true });
  await page.fill('#txtRegistrationNo_cs', process.env.PORTAL_USER);
  await page.fill('#txtPassword_m6cs', process.env.PORTAL_PASS);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
    page.click('#btnlgn'),
  ]);
  console.log('URL after login:', page.url());
  console.log('Title:', await page.title());
  fs.writeFileSync(`${OUT}/after_login.html`, await page.content());
  await page.screenshot({ path: `${OUT}/after_login.png`, fullPage: true });
  await ctx.storageState({ path: `${OUT}/state.json` });

  const links = await page.$$eval('a[href]', as => as.map(a => ({ text: a.textContent.trim().replace(/\s+/g, ' '), href: a.getAttribute('href') })));
  fs.writeFileSync(`${OUT}/links.json`, JSON.stringify(links, null, 2));
  console.log('links found:', links.length);
  await browser.close();
})();
