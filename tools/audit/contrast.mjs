// Verifies WCAG contrast for every text/background pair declared in tokens.css (normal + high-contrast sets).
import fs from 'node:fs';

const css = fs.readFileSync('client/src/styles/tokens.css', 'utf8');
const block = (re) => Object.fromEntries([...(css.match(re)?.[1] ?? '').matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, k, v]) => [k, v]));
const base = block(/:root\[data-theme="sunlight"\]\s*\{([\s\S]*?)\n\}/);
const high = { ...base, ...block(/:root\[data-theme="sunlight"\]\[data-contrast="high"\]\s*\{([\s\S]*?)\n\}/) };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum ratio, what it is]
const PAIRS = [
  ['ink', 'surface', 7, 'body text on cards'], ['ink', 'bg', 7, 'body text on page'], ['ink', 'surface-2', 7, 'body text on tinted'],
  ['ink-2', 'surface', 7, 'secondary text'], ['ink-2', 'bg', 7, 'secondary text on page'],
  ['muted', 'surface', 7, 'captions/hints'], ['muted', 'bg', 7, 'captions on page'], ['muted', 'surface-2', 4.5, 'captions on tinted'],
  ['on-primary', 'primary', 7, 'primary button'], ['on-primary', 'primary-hover', 7, 'primary button hover'],
  ['primary-ink', 'surface', 7, 'links / primary text'], ['primary-ink', 'primary-soft', 7, 'text on primary tint'],
  ['primary-ink', 'bg', 7, 'links on page'], ['ink', 'primary-soft', 7, 'text on primary tint (ink)'],
  ['on-accent', 'accent', 7, 'amber button'], ['accent-ink', 'surface', 7, 'amber-as-text on white'], ['accent-ink', 'accent-soft', 4.5, 'warning badge'],
  ['ink', 'accent-soft', 7, 'warning banner'], ['ok', 'surface', 7, 'success text'], ['ok', 'ok-soft', 4.5, 'success badge'],
  ['bad', 'surface', 7, 'error text'], ['bad', 'bad-soft', 4.5, 'error badge'], ['ink', 'bad-soft', 7, 'error banner'], ['ink', 'ok-soft', 7, 'success banner'],
  ['surface', 'info', 7, 'purple "View" button text'], ['info', 'info-soft', 4.5, 'purple tint badge'],
  ['control-line', 'surface', 3, 'input borders (non-text 3:1)'], ['control-line', 'bg', 3, 'input borders on page'],
  ['focus', 'surface', 3, 'focus ring on white'], ['focus', 'bg', 3, 'focus ring on page'],
];

let failures = 0;
for (const [name, set] of [['SUNLIGHT', base], ['SUNLIGHT + HIGH CONTRAST', high]]) {
  console.log(`\n${name}`);
  for (const [fg, bg, min, label] of PAIRS) {
    const r = ratio(set[fg], set[bg]);
    const ok = r >= min;
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (need ${min})  ${label}  [${fg} ${set[fg]} on ${bg} ${set[bg]}]`);
  }
}
console.log(failures ? `\n${failures} pair(s) FAILED` : '\nAll pairs pass.');
process.exit(failures ? 1 : 0);
