import { Input } from '../atoms/Input.jsx'

/**
 * label + input + mensaje de error. Validación nativa: el error solo aparece tras
 * interactuar (:user-invalid en CSS) y aria-invalid se sincroniza con ese mismo estado.
 */
export function Field({ id, label, hint, error, kind, className = '', ...inputProps }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = `${id}-error`

  const sync = (event) => {
    const el = event.currentTarget
    el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false')
  }
  const markInvalid = (event) => event.currentTarget.setAttribute('aria-invalid', 'true')

  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id} className="field__label">{label}</label>
      {hint && <p id={hintId} className="field__hint muted small">{hint}</p>}
      <Input
        id={id}
        kind={kind}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ')}
        onBlur={sync}
        onInput={sync}
        onInvalid={markInvalid}
        {...inputProps}
      />
      <p id={errorId} className="field__error">↳ {error}</p>
    </div>
  )
}
