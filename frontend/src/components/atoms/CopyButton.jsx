import { useEffect, useRef, useState } from 'react'

/** Botón pequeño "copiar" para direcciones, hashes y txs. */
export function CopyButton({ value, label = 'copiar' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      /* sin permiso de portapapeles: el valor sigue visible para seleccionarlo */
    }
  }

  return (
    <button type="button" className="copy" onClick={copy} title={value}>
      {copied ? '¡copiado!' : label}
    </button>
  )
}
