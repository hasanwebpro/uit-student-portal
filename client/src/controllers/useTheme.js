import { useCallback, useEffect, useState } from 'react';
import { store } from '../models/format.js';

/**
 * 'classic'  → the original portal's look (default).
 * 'sunlight' → high-visibility enhancement: dark ink, AAA contrast, larger type, thumb-reach navigation.
 */
const KEY = 'uit-theme';
const THEMES = ['classic', 'sunlight'];
export const readTheme = () => (THEMES.includes(store.get(KEY)) ? store.get(KEY) : 'classic');
export const applyTheme = (t) => document.documentElement.setAttribute('data-theme', t);

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggle = useCallback(() => setTheme((t) => { const next = t === 'sunlight' ? 'classic' : 'sunlight'; store.set(KEY, next); return next; }), []);
  return { theme, sunlight: theme === 'sunlight', toggle };
}
