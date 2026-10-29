import { CopyButton } from '../atoms/CopyButton.jsx'
import { shortHex } from '../../lib/hash.js'

/**
 * Resultado de una transacción (o de una operación fallida): ok en tinta, error en sello.
 * result = { ok, title, text?, hash?, children? }
 */
export function TxResult({ result, live = true }) {
  if (!result) return null
  return (
    <div className={`txresult ${result.ok ? 'txresult--ok' : 'txresult--error'}`} role={live ? 'status' : undefined}>
      <p className="txresult__title">
        <span aria-hidden="true">{result.ok ? '✓' : '✗'}</span> {result.title}
      </p>
      {result.text && <p className="txresult__text">{result.text}</p>}
      {result.children}
      {result.hash && (
        <p className="txresult__hash small">
          tx <span className="mono">{shortHex(result.hash, 10, 8)}</span> <CopyButton value={result.hash} />
        </p>
      )}
    </div>
  )
}
