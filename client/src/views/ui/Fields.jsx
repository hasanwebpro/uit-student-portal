import { forwardRef, useId, useState } from 'react';
import { Icon } from './Icon.jsx';

/**
 * Every control is wired for assistive tech: a real <label>, hint + error linked via aria-describedby,
 * aria-invalid when there is an error, and `autoComplete`/`inputMode` so phones show the right keyboard.
 */
function Field({ label, hint, error, required, children, id }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true"> *</span>}{required && <span className="visually-hidden"> (required)</span>}</label>
      {children({ 'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined, 'aria-invalid': error ? 'true' : undefined, 'aria-required': required || undefined })}
      {hint && <span id={hintId} className="hint">{hint}</span>}
      {error && <span id={errId} className="error" role="alert"><Icon name="alert" />{error}</span>}
    </div>
  );
}

export const TextField = forwardRef(function TextField({ label, hint, error, required, className = '', id: given, ...props }, ref) {
  const auto = useId();
  const id = given ?? auto;
  return <Field {...{ label, hint, error, required, id }}>{(aria) => <input ref={ref} id={id} className={`input ${className}`} {...aria} {...props} />}</Field>;
});

export function TextAreaField({ label, hint, error, required, className = '', id: given, ...props }) {
  const auto = useId();
  const id = given ?? auto;
  return <Field {...{ label, hint, error, required, id }}>{(aria) => <textarea id={id} {...aria} {...props} className={`textarea ${className}`} />}</Field>;
}

export function SelectField({ label, hint, error, required, children, className = '', id: given, ...props }) {
  const auto = useId();
  const id = given ?? auto;
  return <Field {...{ label, hint, error, required, id }}>{(aria) => <select id={id} {...aria} {...props} className={`select ${className}`}>{children}</select>}</Field>;
}

export function PasswordField({ label, hint, error, required, id: given, ...props }) {
  const auto = useId();
  const id = given ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <Field {...{ label, hint, error, required, id }}>
      {(aria) => (
        <div className="pw">
          <input id={id} className="input" type={shown ? 'text' : 'password'} autoCapitalize="none" spellCheck={false} {...aria} {...props} />
          <button type="button" className="btn btn--quiet btn--sm" aria-pressed={shown} onClick={() => setShown((s) => !s)}>{shown ? 'Hide' : 'Show'}<span className="visually-hidden"> password</span></button>
        </div>
      )}
    </Field>
  );
}

export function CheckField({ label, ...props }) {
  return <label className="check"><input type="checkbox" {...props} /><span>{label}</span></label>;
}
