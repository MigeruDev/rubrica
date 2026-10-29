import { useEffect, useRef, useState } from 'react'
import { shortHex } from '../../lib/hash.js'

export function roleLabel(roles) {
  if (roles.admin && roles.issuer) return 'admin · emisor'
  if (roles.admin) return 'admin'
  if (roles.issuer) return 'emisor'
  return 'sin rol'
}

/** Dirección + rol detectado como etiqueta de cuaderno; clic = copiar. */
export function AddressChip({ address, roles }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      /* sin portapapeles */
    }
  }

  return (
    <button type="button" className="chip" onClick={copy} title={`${address} — clic para copiar`}>
      <span className="chip__role">{roleLabel(roles)}</span>
      <span className="mono chip__addr">{copied ? '¡copiado!' : shortHex(address)}</span>
    </button>
  )
}
