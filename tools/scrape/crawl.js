// Read-only crawler: GET navigation only. Never submits forms or triggers postbacks.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const BASE = 'https://eduboard.uit.edu';

const PAGES = [
  'Dashboard', 'course', 'assessmentmarks', 'seatingplan', 'onlineexam/0', 'transcript',
  'viewadmitcard', 'viewlabadmitcard', 'ledger', 'advance', 'timetable', 'todolist',
  'attendance', 'communicatornote', 'roadmap', 'workflow', 'changepassword',
  'studentploattainment', 'onlinesemesterregistration', 'demograph', 'activity',
  'communicator', 'Announcements', 'Survey/1', 'Student/Ledger', 'Activity',
];
const slug = p => p.replace(/[^a-z0-9]+/gi, '_').toLowerCase();

(async () => {
  for (const d of ['html', 'shots', 'mirror', 'xhr']) fs.mkdirSync(`${OUT}/${d}`, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ storageState: `${OUT}/state.json`, viewport: { width: 1366, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const seen = new Set();
  const report = [];

  page.on('response', async r => {
    try {
      const url = r.url();
      if (!url.startsWith(BASE) && !/fonts\.(googleapis|gstatic)\.com/.test(url)) return;
      if (seen.has(url) || r.status() !== 200) return;
      const ct = r.headers()['content-type'] || '';
      const u = new URL(url);
      if (/text\/html/.test(ct)) return;                       // pages are saved separately
      seen.add(url);
      const body = await r.body();
      const isData = /json|xml/.test(ct) || (r.request().method() !== 'GET');
      const dir = isData ? 'xhr' : 'mirror';
      const rel = (u.host + u.pathname).replace(/[^a-zA-Z0-9_./-]/g, '_') + (u.search ? '__' + Buffer.from(u.search).toString('hex').slice(0, 16) : '');
      const dest = path.join(OUT, dir, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, body);
    } catch (_) { /* best effort */ }
  });

  for (const p of PAGES) {
    const url = `${BASE}/StudentPortal/${p}`;
    const entry = { page: p, url };
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      entry.status = resp && resp.status();
      entry.finalUrl = page.url();
      entry.title = await page.title();
      fs.writeFileSync(`${OUT}/html/${slug(p)}.html`, await page.content());
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.screenshot({ path: `${OUT}/shots/${slug(p)}_desktop.png`, fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `${OUT}/shots/${slug(p)}_mobile.png`, fullPage: true });
      entry.tables = await page.$$eval('table', ts => ts.length);
      entry.forms = await page.$$eval('input,select,textarea,button', e => e.length);
      entry.text = (await page.innerText('body')).slice(0, 300).replace(/\s+/g, ' ');
    } catch (e) { entry.error = String(e).slice(0, 200); }
    report.push(entry);
    console.log(entry.status, p, '->', (entry.finalUrl || '').replace(BASE, ''), '| tables', entry.tables, '| inputs', entry.forms, entry.error || '');
  }
  fs.writeFileSync(`${OUT}/crawl_report.json`, JSON.stringify(report, null, 2));
  await browser.close();
})();
