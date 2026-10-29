/** Arco dibujado que gira: indicador de carga para botones y resultados. */
export function Spinner({ className = '' }) {
  return (
    <svg className={`spinner ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
