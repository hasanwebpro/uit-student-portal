import { useEffect, useId, useRef } from 'react';
import { Button } from './primitives.jsx';
import { Icon } from './Icon.jsx';

/**
 * Native <dialog>: the browser provides the focus trap, Esc-to-close, inert background and focus return.
 * We add the accessible name, backdrop-click closing, and scroll locking.
 */
export function Dialog({ open, onClose, title, children, footer, variant = 'modal' }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (open && !el.open) { el.showModal(); document.body.style.overflow = 'hidden'; }
    if (!open && el.open) el.close();
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <dialog ref={ref} className={`dialog ${variant === 'panel' ? 'panel' : ''}`} aria-labelledby={titleId} onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <>
          <div className="dialog__head">
            <h2 id={titleId}>{title}</h2>
            {variant === 'panel' && <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>}
          </div>
          <div className="dialog__body">{children}</div>
          {footer !== null && <div className="dialog__foot">{footer === undefined ? <Button variant="secondary" onClick={onClose}>Close</Button> : footer}</div>}
        </>
      )}
    </dialog>
  );
}
