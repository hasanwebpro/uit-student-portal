#!/usr/bin/env node
/**
 * One-click launcher for the UIT Student Portal (Windows · macOS · Linux). Needs only Node.js 20+.
 *
 *   1. checks Node            5. checks MySQL (asks for the connection once, saved in .env)
 *   2. installs missing deps  6. starts the server on the first free port ≥ 3000
 *   3. checks for updates     7. opens your browser
 *   4. builds the client when its source changed
 *
 * Flags:  --preview  run with built-in sample data, no MySQL needed      --no-open    don't open a browser
 *         --update   force the update check now                          --no-update  skip it
 *         --yes      accept defaults (no prompts)                        --install-shortcut   (re)create the Desktop shortcut
 *         --reconfigure   ask for the MySQL connection again
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = path.join(ROOT, 'client');
const STATE_FILE = path.join(ROOT, '.launcher-state.json');
const ENV_FILE = path.join(ROOT, '.env');
const args = new Set(process.argv.slice(2));
const IS_WIN = process.platform === 'win32';
const INTERACTIVE = process.stdin.isTTY && !args.has('--yes');
const DAY = 86_400_000;

// ── tiny console helpers ─────────────────────────────────────
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (n, s) => (color ? `\x1b[${n}m${s}\x1b[0m` : s);
const bold = (s) => paint(1, s); const dim = (s) => paint(2, s);
const green = (s) => paint(32, s); const yellow = (s) => paint(33, s); const red = (s) => paint(31, s); const cyan = (s) => paint(36, s);
let step = 0;
const TOTAL = 6;
const heading = (t) => console.log(`\n${cyan(`[${++step}/${TOTAL}]`)} ${bold(t)}`);
const ok = (t) => console.log(`  ${green('✔')} ${t}`);
const warn = (t) => console.log(`  ${yellow('!')} ${t}`);
const info = (t) => console.log(`  ${dim(t)}`);
function die(message, hint) {
  console.log(`\n${red('✖')} ${bold(message)}`);
  if (hint) console.log(hint.split('\n').map((l) => `  ${l}`).join('\n'));
  process.exit(1);
}

const rl = INTERACTIVE ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const ask = (question, fallback = '') => new Promise((resolve) => {
  if (!rl) return resolve(fallback);
  rl.question(`  ${question}${fallback ? dim(` [${fallback}]`) : ''} `, (a) => resolve(a.trim() || fallback));
});
const confirm = async (question, def = true) => {
  const a = (await ask(`${question} ${def ? '[Y/n]' : '[y/N]'}`, '')).toLowerCase();
  return a === '' ? def : a.startsWith('y');
};

const readState = () => { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; } };
const writeState = (patch) => { try { fs.writeFileSync(STATE_FILE, JSON.stringify({ ...readState(), ...patch }, null, 2)); } catch { /* read-only folder: harmless */ } };

/** Run a command to completion, streaming its output. `npm` needs a shell on Windows (npm.cmd). */
function run(cmd, cmdArgs, cwd = ROOT, { quiet = false } = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: quiet ? 'pipe' : 'inherit', shell: IS_WIN && cmd === 'npm', encoding: 'utf8' });
  return r;
}

// ── 1. Node ──────────────────────────────────────────────────
function checkNode() {
  heading('Checking Node.js');
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) die(`Node.js ${process.versions.node} is too old (need 20 or newer).`, 'Install the current LTS from https://nodejs.org and run this again.');
  ok(`Node.js ${process.versions.node}`);
  const npm = run('npm', ['--version'], ROOT, { quiet: true });
  if (npm.status !== 0) die('npm was not found.', 'It ships with Node.js — reinstall Node from https://nodejs.org.');
  ok(`npm ${npm.stdout.trim()}`);
}

// ── 2. dependencies ──────────────────────────────────────────
const needsInstall = (dir) => {
  const modules = path.join(dir, 'node_modules');
  const lock = path.join(dir, 'package-lock.json');
  const marker = path.join(modules, '.package-lock.json');           // written by npm after every install
  if (!fs.existsSync(modules) || !fs.existsSync(marker)) return true;
  return fs.existsSync(lock) && fs.statSync(lock).mtimeMs > fs.statSync(marker).mtimeMs + 1000;
};
function ensureDependencies() {
  heading('Installing dependencies (only what is missing)');
  for (const [name, dir] of [['server', ROOT], ['client', CLIENT]]) {
    if (!needsInstall(dir)) { ok(`${name}: already installed`); continue; }
    info(`${name}: installing — this can take a minute the first time…`);
    const r = run('npm', ['install', '--no-fund', '--no-audit', '--loglevel=error'], dir);
    if (r.status !== 0) die(`Installing the ${name} dependencies failed.`, 'Check your internet connection and try again.');
    ok(`${name}: installed`);
  }
}

// ── 3. updates ───────────────────────────────────────────────
function checkUpdates() {
  heading('Checking for updates');
  const due = args.has('--update') || Date.now() - (readState().lastUpdate ?? 0) > DAY;
  if (args.has('--no-update') || process.env.UIT_SKIP_UPDATE === '1') return ok('skipped (--no-update)');
  if (!due) return ok(`checked ${Math.round((Date.now() - readState().lastUpdate) / 3_600_000)} h ago — next check in ≤ 24 h (use --update to force)`);

  let changed = 0;
  for (const [name, dir] of [['server', ROOT], ['client', CLIENT]]) {
    const lock = path.join(dir, 'package-lock.json');
    const before = fs.existsSync(lock) ? fs.readFileSync(lock, 'utf8') : '';
    const r = run('npm', ['update', '--no-fund', '--no-audit', '--loglevel=error'], dir, { quiet: true });
    if (r.status !== 0) { warn(`${name}: could not check (offline?) — continuing with what is installed`); continue; }
    const after = fs.existsSync(lock) ? fs.readFileSync(lock, 'utf8') : '';
    if (before !== after) { changed += 1; ok(`${name}: packages updated to the latest compatible versions`); } else ok(`${name}: up to date`);
    const outdated = run('npm', ['outdated', '--json'], dir, { quiet: true });
    try {
      const major = Object.entries(JSON.parse(outdated.stdout || '{}')).filter(([, v]) => v.latest && v.wanted && v.latest !== v.wanted);
      if (major.length) info(`${name}: ${major.length} major version(s) available, not applied automatically (${major.map(([k]) => k).slice(0, 4).join(', ')}${major.length > 4 ? '…' : ''})`);
    } catch { /* no data: fine */ }
  }
  writeState({ lastUpdate: Date.now() });
  if (changed) writeState({ forceBuild: true });                    // new client libs → rebuild
}

// ── 4. build the client when stale ───────────────────────────
function newestMtime(target) {
  let newest = 0;
  const walk = (p) => {
    const s = fs.statSync(p);
    if (s.isDirectory()) { for (const f of fs.readdirSync(p)) if (f !== 'node_modules' && f !== 'dist') walk(path.join(p, f)); } else newest = Math.max(newest, s.mtimeMs);
  };
  if (fs.existsSync(target)) walk(target);
  return newest;
}
function buildClient() {
  heading('Preparing the web app');
  const built = path.join(CLIENT, 'dist', 'index.html');
  const sources = Math.max(...['src', 'public', 'index.html', 'package.json', 'vite.config.js'].map((f) => newestMtime(path.join(CLIENT, f))));
  const stale = !fs.existsSync(built) || sources > fs.statSync(built).mtimeMs || readState().forceBuild;
  if (!stale) return ok('already built and up to date');
  info('building (a few seconds)…');
  const r = run('npm', ['run', 'build', '--loglevel=error'], CLIENT);
  if (r.status !== 0) die('Building the web app failed.', 'Scroll up for the error. If it mentions a missing module, delete the "client/node_modules" folder and run this again.');
  writeState({ forceBuild: false });
  ok('built');
}

// ── 5. MySQL ─────────────────────────────────────────────────
function parseEnv() {
  const out = {};
  if (!fs.existsSync(ENV_FILE)) return out;
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const tcpOpen = (host, port, timeout = 1500) => new Promise((resolve) => {
  const s = net.connect({ host, port });
  const done = (v) => { s.destroy(); resolve(v); };
  s.setTimeout(timeout, () => done(false)); s.once('connect', () => done(true)); s.once('error', () => done(false));
});
async function configureMysql() {
  console.log(`  ${bold('MySQL connection')} ${dim('(saved to the .env file next to this launcher; it never leaves your computer)')}`);
  const cfg = {
    MYSQL_HOST: await ask('Host', '127.0.0.1'), MYSQL_PORT: await ask('Port', '3306'), MYSQL_USER: await ask('User', 'root'),
    MYSQL_PASSWORD: await ask('Password (empty if none)', ''), MYSQL_DATABASE: await ask('Database name (created for you)', 'uit_portal'),
  };
  fs.writeFileSync(ENV_FILE, `# written by the launcher — edit freely\n${Object.entries(cfg).map(([k, v]) => `${k}=${v}`).join('\n')}\n`);
  ok('saved .env');
}
async function tryStartMysqlService() {
  if (!IS_WIN) return false;
  for (const svc of ['MySQL80', 'MySQL', 'MySQL57', 'MariaDB']) {
    const r = spawnSync('net', ['start', svc], { stdio: 'pipe', encoding: 'utf8', shell: true });
    if (r.status === 0 || /already been started/i.test(`${r.stdout}${r.stderr}`)) { info(`started Windows service "${svc}"`); return true; }
  }
  return false;
}
/** A stable signing key in .env keeps students signed in across restarts (without it the server invents a new one each start). */
function ensureJwtSecret() {
  if (parseEnv().JWT_SECRET) return;
  const line = `JWT_SECRET=${crypto.randomBytes(48).toString('base64')}\n`;
  fs.appendFileSync(ENV_FILE, fs.existsSync(ENV_FILE) && !fs.readFileSync(ENV_FILE, 'utf8').endsWith('\n') ? `\n${line}` : line);
  ok('generated a private JWT_SECRET in .env');
}
/** Returns 'mysql' or 'preview'. */
async function checkDatabase() {
  heading('Checking MySQL');
  if (args.has('--preview')) { warn('preview mode requested'); return 'preview'; }
  if (args.has('--reconfigure') && fs.existsSync(ENV_FILE)) fs.rmSync(ENV_FILE);
  if (!fs.existsSync(ENV_FILE)) {
    if (!INTERACTIVE) info('no .env found — using defaults (127.0.0.1:3306, user root, empty password)');
    else if (await confirm('Do you have MySQL (or MariaDB / XAMPP) installed on this computer?', true)) await configureMysql();
    else return noMysql();
  }
  const env = { MYSQL_HOST: '127.0.0.1', MYSQL_PORT: '3306', ...parseEnv() };
  let up = await tcpOpen(env.MYSQL_HOST, Number(env.MYSQL_PORT));
  if (!up && ['127.0.0.1', 'localhost'].includes(env.MYSQL_HOST) && await tryStartMysqlService()) {
    for (let i = 0; i < 10 && !up; i += 1) { await new Promise((r) => setTimeout(r, 1000)); up = await tcpOpen(env.MYSQL_HOST, Number(env.MYSQL_PORT)); }
  }
  if (up) { ok(`MySQL is answering on ${env.MYSQL_HOST}:${env.MYSQL_PORT}`); ensureJwtSecret(); return 'mysql'; }
  warn(`nothing is listening on ${env.MYSQL_HOST}:${env.MYSQL_PORT}`);
  return noMysql();
}
async function noMysql() {
  console.log(`
  ${bold('MySQL is not running.')} To use the real database:
    • Windows: install "MySQL Installer" (mysql.com/downloads) or XAMPP (apachefriends.org), then start MySQL
    • macOS:   brew install mysql && brew services start mysql
    • Linux:   sudo apt install mysql-server   (or mariadb-server)
  Then run this launcher again.  ${dim('(Use --reconfigure to re-enter the connection details.)')}
`);
  if (INTERACTIVE && await confirm('Open the portal in PREVIEW mode instead? (sample data, nothing is saved, no database needed)', true)) return 'preview';
  if (!INTERACTIVE) { warn('no terminal to ask — falling back to preview mode'); return 'preview'; }
  return process.exit(1);
}

// ── 6/7. start + open ────────────────────────────────────────
async function freePort(start = 3000) {
  for (let p = start; p < start + 20; p += 1) {
    if (await new Promise((res) => { const s = net.createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))).listen(p, '127.0.0.1'); })) return p;
  }
  return die('No free port between 3000 and 3019.');
}
async function waitUntilReady(port, child, ms = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (child.exitCode !== null) return false;
    try { const r = await fetch(`http://127.0.0.1:${port}/login`, { signal: AbortSignal.timeout(1500) }); if (r.ok) return true; } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
function openBrowser(url) {
  const [cmd, a] = IS_WIN ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try { spawn(cmd, a, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch { /* user can click the link */ }
}
async function startServer(mode) {
  heading(mode === 'preview' ? 'Starting preview (sample data)' : 'Starting the portal');
  const port = await freePort(mode === 'preview' ? 4173 : 3000);
  const entry = mode === 'preview' ? ['tools/audit/mock-server.mjs'] : [...(fs.existsSync(ENV_FILE) ? ['--env-file=.env'] : []), 'server/index.js'];
  const child = spawn(process.execPath, entry, { cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  const pipe = (stream) => stream.on('data', (d) => { const t = d.toString(); log += t; process.stdout.write(dim(t.split('\n').filter(Boolean).map((l) => `  │ ${l}`).join('\n') + '\n')); });
  pipe(child.stdout); pipe(child.stderr);

  const stop = () => { if (child.exitCode === null) child.kill(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);

  if (!(await waitUntilReady(port, child))) {
    const hint = /ER_ACCESS_DENIED/i.test(log) ? 'MySQL refused the user name or password.\nRun the launcher with --reconfigure to enter them again.'
      : /ECONNREFUSED|ETIMEDOUT/i.test(log) ? 'The server could not reach MySQL. Make sure it is running, then try again.'
        : /EADDRINUSE/i.test(log) ? 'Another program is using that port.' : 'See the messages above for the reason.';
    die('The portal did not start.', hint);
  }
  const url = `http://localhost:${port}`;
  console.log(`\n${green('✔')} ${bold('Portal is running')}  →  ${cyan(url)}`);
  console.log(`  Sign in with  ${bold('23FA-001-SE')}  /  ${bold('Portal@2026')}   ${dim('(fictional demo student)')}`);
  if (mode === 'preview') console.log(`  ${yellow('PREVIEW MODE:')} sample data, nothing is saved. Install MySQL for the real thing.`);
  console.log(`  ${dim('Keep this window open while you test. Close it (or press Ctrl+C) to stop the portal.')}`);
  if (!args.has('--no-open')) openBrowser(url);
  child.on('exit', (code) => { console.log(`\n${yellow('The portal stopped')} (exit ${code}).`); process.exit(code ?? 0); });
}

// ── desktop shortcut ─────────────────────────────────────────
function createShortcut() {
  const desktop = (() => {
    if (IS_WIN) { const r = spawnSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('Desktop')"], { encoding: 'utf8' }); return (r.stdout || '').trim() || path.join(os.homedir(), 'Desktop'); }
    return path.join(os.homedir(), 'Desktop');
  })();
  if (!fs.existsSync(desktop)) return warn(`no Desktop folder found at ${desktop}`);
  try {
    if (IS_WIN) {
      const target = path.join(ROOT, 'Start UIT Portal.bat');
      const ps = `$s=(New-Object -ComObject WScript.Shell).CreateShortcut(${JSON.stringify(path.join(desktop, 'UIT Student Portal.lnk'))});$s.TargetPath=${JSON.stringify(target)};$s.WorkingDirectory=${JSON.stringify(ROOT)};$s.Description='Start the UIT Student Portal';$s.Save()`.replace(/"/g, "'");
      const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
      if (r.status !== 0) throw new Error(r.stderr || 'PowerShell failed');
    } else if (process.platform === 'darwin') {
      const f = path.join(desktop, 'UIT Student Portal.command');
      fs.writeFileSync(f, `#!/bin/bash\ncd "${ROOT}" && ./"Start UIT Portal.command"\n`, { mode: 0o755 });
    } else {
      const f = path.join(desktop, 'UIT Student Portal.desktop');
      fs.writeFileSync(f, `[Desktop Entry]\nType=Application\nName=UIT Student Portal\nExec=bash "${path.join(ROOT, 'start-uit-portal.sh')}"\nPath=${ROOT}\nTerminal=true\n`, { mode: 0o755 });
    }
    ok(`Desktop shortcut created in ${desktop}`);
  } catch (err) { warn(`could not create the shortcut (${err.message.trim()}). You can drag the start file to your Desktop instead.`); }
}
async function offerShortcut() {
  if (args.has('--install-shortcut')) return createShortcut();
  const state = readState();
  if (state.shortcutOffered || !INTERACTIVE) return;
  writeState({ shortcutOffered: true });
  if (await confirm('Create a shortcut on your Desktop so you can start the portal with one double-click?', true)) createShortcut();
}

// ── main ─────────────────────────────────────────────────────
console.log(`\n${bold('UIT Student Portal')} ${dim('— launcher')}\n${dim(`folder: ${ROOT}`)}`);
checkNode();
ensureDependencies();
checkUpdates();
buildClient();
const mode = await checkDatabase();
await offerShortcut();
rl?.close();
await startServer(mode);
