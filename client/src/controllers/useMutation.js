import { useCallback, useState } from 'react';

/**
 * Wraps a write call: tracks busy state, captures the error (with per-field `details` from the API),
 * and prevents double submits while a request is in flight.
 */
export function useMutation(fn) {
  const [state, setState] = useState({ busy: false, error: null });
  const run = useCallback(async (...args) => {
    if (state.busy) return undefined;
    setState({ busy: true, error: null });
    try {
      const result = await fn(...args);
      setState({ busy: false, error: null });
      return result ?? true;
    } catch (error) {
      setState({ busy: false, error });
      return undefined;
    }
  }, [fn, state.busy]);
  const reset = useCallback(() => setState({ busy: false, error: null }), []);
  return { run, reset, busy: state.busy, error: state.error, fieldErrors: state.error?.details ?? {} };
}
