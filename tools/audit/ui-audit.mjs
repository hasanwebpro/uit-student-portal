// Usage: node tools/audit/ui-audit.mjs <baseUrl> <outDir> [reg] [password]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Playwright is pre-installed globally in the sandbox (resolved through NODE_PATH, which ESM imports ignore).
const { chromium } = require('playwright');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const [base = 'http://localhost:4173', out = './audit-out', reg = '23FA-001-SE', pw = 'Portal@2026'] = process.argv.slice(2);
const THEME = process.env.THEME === 'sunlight' ? 'sunlight' : 'classic';
fs.mkdirSync(out, { recursive: true });

const ROUTES = ['/', '/courses', '/courses/1', '/exams/assessments', '/exams/seating', '/exams/online', '/exams/transcript', '/exams/admit-card', '/exams/lab-admit-card',
  '/fees/ledger', '/fees/advance', '/general/timetable', '/general/todo', '/general/attendance', '/general/communication', '/communicator', '/general/roadmap', '/general/workflow',
  '/general/plo', '/general/password', '/registration', '/profile', '/announcements', '/surveys', '/activity', '/nope'];
const SIZES = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844 } };
const slug = (r) => (r === '/' ? 'dashboard' : r.slice(1).replace(/\//g, '_'));

const browser = await chromium.launch();
const results = [];
for (const [label, viewport] of Object.entries(SIZES)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: label === 'mobile' ? 2 : 1, hasTouch: label === 'mobile', isMobile: label === 'mobile' });
  // pick the theme before first paint, and skip the once-per-session announcements pop-up so it does not cover pages
  await ctx.addInitScript((theme) => { try { localStorage.setItem('uit-theme', theme); sessionStorage.setItem('uit-ann-seen', '1'); } catch { /* storage unavailable */ } }, THEME);
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`));

  // login page itself
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(out, `${THEME}-login-${label}.png`), fullPage: true });
  await page.addScriptTag({ content: axeSource });
  const loginAxe = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
  results.push({ route: '/login', label, violations: loginAxe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })), overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), problems: [...problems] });

  await page.fill('input[name="regNo"]', reg); await page.fill('input[name="password"]', pw);
  await Promise.all([page.waitForURL(`${base}/`), page.click('button[type="submit"]')]);

  for (const route of ROUTES) {
    problems.length = 0;
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 8000 }).catch(() => problems.push('no <h1> rendered'));
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, `${THEME}-${slug(route)}-${label}.png`), fullPage: true });
    await page.addScriptTag({ content: axeSource });
    const axe = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const h1s = await page.$$eval('h1', (e) => e.length);
    results.push({ route, label, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, sample: v.nodes[0]?.html?.slice(0, 140) })), overflow, h1s, problems: [...problems] });
  }
  await ctx.close();
}
await browser.close();

// Classic is a faithful copy of the original portal's palette, whose low contrast is a known property of that design
// (the Sunlight theme is the accessible one). Report it, but do not count it as a failure there.
const KNOWN = THEME === 'classic' ? new Set(['color-contrast']) : new Set();
let known = 0;
let bad = 0;
for (const r of results) {
  const flags = [];
  known += r.violations.filter((v) => KNOWN.has(v.id)).length;
  r.violations = r.violations.filter((v) => !KNOWN.has(v.id));
  if (r.violations.length) flags.push(`axe:${r.violations.map((v) => `${v.id}×${v.nodes}`).join(',')}`);
  if (r.overflow) flags.push('HORIZONTAL-OVERFLOW');
  if (r.h1s !== undefined && r.h1s !== 1) flags.push(`h1s=${r.h1s}`);
  if (r.problems.length) flags.push(...r.problems.map((p) => `!${p}`));
  if (flags.length) { bad += 1; console.log(`${r.label.padEnd(7)} ${r.route.padEnd(24)} ${flags.join(' | ')}`); }
}
console.log(`\n${results.length} page checks, ${results.length - bad} clean, ${bad} with findings` + (known ? `  (+ ${known} inherited colour-contrast items on pages in the original's palette)` : ''));
console.log(`theme: ${THEME}`);
fs.writeFileSync(path.join(out, `report-${THEME}.json`), JSON.stringify(results, null, 2));
