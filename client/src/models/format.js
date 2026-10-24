/** Presentation helpers. Calendar dates ("YYYY-MM-DD") are formatted in UTC so they never shift a day. */
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
const moneyFmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export const formatDate = (iso) => (iso ? dateFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)) : '—');
export const formatDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export const formatMoney = (n) => `Rs ${moneyFmt.format(Math.abs(n ?? 0))}`;
export const formatBalance = (n) => (n > 0 ? `${formatMoney(n)} due` : n < 0 ? `${formatMoney(n)} credit` : 'Rs 0');
export const formatTimeRange = (start, end) => `${start}–${end}`;
export const formatGpa = (n) => (n == null ? '—' : Number(n).toFixed(2));
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const todayIso = () => new Date().toISOString().slice(0, 10);
export const isOverdue = (iso) => !!iso && iso < todayIso();

/** Safe localStorage (private windows and blocked storage throw). */
export const store = {
  get(key, fallback = null) { try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { window.localStorage.setItem(key, value); } catch { /* ignore */ } },
};

const dmFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const hmFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
const dMonYFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "25-10" from an ISO date or timestamp. */
export const formatDayMonth = (iso) => (iso ? dmFmt.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)).replace('/', '-') : '—');
/** "02:11" (24-hour, local). */
export const formatHm = (iso) => (iso ? hmFmt.format(new Date(iso)) : '');
/** "18-Aug-2026" — the format the original portal uses in lists. */
export const formatDashDate = (iso) => (iso ? dMonYFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)).replace(/ /g, '-') : '—');
/** "(BS) - Software Engineering - 4YR" like the original's Program Structure line. */
export const programLabel = (name = '') => name.replace(/^(\w+) - /, '($1) - ').replace(/(\d)Yr$/i, '$1YR');
export const twoDecimals = (n) => Number(n ?? 0).toFixed(2);

/** Session-scoped flag (cleared when the tab closes). */
export const sessionFlag = {
  get(key) { try { return window.sessionStorage.getItem(key) === '1'; } catch { return false; } },
  set(key) { try { window.sessionStorage.setItem(key, '1'); } catch { /* ignore */ } },
};
