import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthModel } from '../models/portal.js';
import { clearQueryCache } from './useQuery.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/** status: 'loading' (checking cookie) | 'authed' | 'anon' */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', student: null });

  useEffect(() => {
    let live = true;
    AuthModel.me().then(({ student }) => live && setState(student ? { status: 'authed', student } : { status: 'anon', student: null })).catch(() => live && setState({ status: 'anon', student: null }));
    return () => { live = false; };
  }, []);

  // any API call that gets a 401 (session expired elsewhere) drops us back to the login screen
  useEffect(() => {
    const expired = () => { clearQueryCache(); setState({ status: 'anon', student: null }); };
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, []);

  const login = useCallback(async (regNo, password, remember = false) => {
    const { student } = await AuthModel.login(regNo, password, remember);
    clearQueryCache();
    setState({ status: 'authed', student });
  }, []);

  const logout = useCallback(async () => {
    try { await AuthModel.logout(); } finally { clearQueryCache(); setState({ status: 'anon', student: null }); }
  }, []);

  /** Re-read the signed-in student (e.g. after changing the profile picture). */
  const refresh = useCallback(async () => {
    const { student } = await AuthModel.me();
    if (student) setState((s) => ({ ...s, student: { ...student, avatarVersion: Date.now() } }));
  }, []);

  const value = useMemo(() => ({ ...state, login, logout, refresh }), [state, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
