import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query; used to render a table on wide screens and cards on narrow ones. */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (notify) => { const m = window.matchMedia(query); m.addEventListener('change', notify); return () => m.removeEventListener('change', notify); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
