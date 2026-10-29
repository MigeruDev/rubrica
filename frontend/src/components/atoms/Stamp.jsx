const VARIANTS = {
  valid: { icon: '✓', text: 'Válido' },
  revoked: { icon: '✗', text: 'Revocado' },
  mismatch: { icon: '✗', text: 'No coincide' },
  notfound: { icon: '?', text: 'No existe' },
}

/** El componente firma: resultado de verificación como sello de caucho girado. */
export function Stamp({ variant, className = '' }) {
  const v = VARIANTS[variant] ?? VARIANTS.notfound
  return (
    <span className={`stamp stamp--${variant} ${className}`.trim()}>
      <span className="stamp__icon" aria-hidden="true">{v.icon}</span> {v.text}
    </span>
  )
}
