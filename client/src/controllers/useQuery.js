import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tiny stale-while-revalidate data hook.
 *  - shows cached data instantly (if any) and refreshes in the background
 *  - aborts in-flight requests when the key changes or the component unmounts
 *  - cache is wiped on sign-out so one student's data can never flash for the next
 */
const cache = new Map();
export const clearQueryCache = () => cache.clear();

export function useQuery(key, fetcher, { enabled = true } = {}) {
  const cached = cache.get(key);
  const [state, setState] = useState({ data: cached, error: null, loading: enabled && cached === undefined });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const controllerRef = useRef(null);

  const run = useCallback(async ({ silent = false } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((s) => ({ ...s, loading: !silent && s.data === undefined, error: silent ? s.error : null }));
    try {
      const data = await fetcherRef.current(controller.signal);
      cache.set(key, data);
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (error.name === 'AbortError') return undefined;
      setState((s) => ({ ...s, error, loading: false }));
      return undefined;
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) { setState({ data: undefined, error: null, loading: false }); return undefined; }
    const hit = cache.get(key);
    setState({ data: hit, error: null, loading: hit === undefined });
    run({ silent: hit !== undefined });
    return () => controllerRef.current?.abort();
  }, [key, enabled, run]);

  return { ...state, refetch: () => run({ silent: true }) };
}
