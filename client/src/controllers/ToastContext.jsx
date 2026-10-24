import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icon } from '../views/ui/Icon.jsx';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((message, kind = 'ok') => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    setTimeout(() => dismiss(id), kind === 'bad' ? 9000 : 5000);
  }, [dismiss]);

  const api = useMemo(() => ({ success: (m) => push(m, 'ok'), error: (m) => push(m, 'bad') }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Polite live region: screen readers announce each message without stealing focus. */}
      <div className="toasts" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <span>{t.message}</span>
            <button type="button" className="icon-btn" aria-label="Dismiss message" onClick={() => dismiss(t.id)}><Icon name="x" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
