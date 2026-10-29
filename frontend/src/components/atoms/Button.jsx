import { Spinner } from './Spinner.jsx'

/**
 * Botón nativo estilizado. Variantes: primary | secondary | danger.
 * `loading` pone aria-busy, muestra el spinner y deshabilita.
 * Con `href` se renderiza como enlace con el mismo aspecto (CTA de scroll).
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  href,
  className = '',
  children,
  ...rest
}) {
  const classes = `btn btn--${variant} ${className}`.trim()
  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        <span className="btn__label">{children}</span>
      </a>
    )
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading && <Spinner />}
      <span className="btn__label">{children}</span>
    </button>
  )
}
