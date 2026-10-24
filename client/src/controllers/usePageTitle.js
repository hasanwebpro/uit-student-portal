import { useEffect } from 'react';

const SUFFIX = 'UIT Student Portal';
/** Keeps the tab title (and what screen readers announce on navigation) in sync with the page. */
export function usePageTitle(title) {
  useEffect(() => { document.title = title ? `${title} · ${SUFFIX}` : SUFFIX; }, [title]);
}
