const MONO_KINDS = new Set(['address', 'hash', 'id'])

/** Input nativo tratado como contenedor de texto normal; mono para 0x…, hashes e ids. */
export function Input({ kind, className = '', ref, ...rest }) {
  const mono = MONO_KINDS.has(kind)
  return <input ref={ref} className={`input ${mono ? 'input--mono' : ''} ${className}`.trim()} {...rest} />
}
