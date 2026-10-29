import { useEffect, useState } from 'react'
import { ROLES, publicClient, registry } from '../../contract.js'
import { isAddress, shortHex } from '../../lib/hash.js'
import { errorMessage } from '../../lib/errors.js'
import { useTx } from '../../hooks/useTx.js'
import { useDebouncedValue } from '../../hooks/useDebounce.js'
import { Button } from '../atoms/Button.jsx'
import { Spinner } from '../atoms/Spinner.jsx'
import { Underlined } from '../atoms/Underline.jsx'
import { Field } from '../molecules/Field.jsx'
import { TxResult } from '../molecules/TxResult.jsx'
import { ADDRESS_PATTERN } from './IssuePanel.jsx'

/** Panel de admin: otorgar / quitar ISSUER_ROLE con lookup previo del estado del rol. */
export function AdminPanel({ walletClient, account, onRolesChanged }) {
  const [target, setTarget] = useState('')
  const [tick, setTick] = useState(0)
  const [acting, setActing] = useState(null)
  const debounced = useDebouncedValue(target.trim(), 350)
  const [lookup, setLookup] = useState({ status: 'idle' })
  const { send, pending, result } = useTx({ walletClient, account })
  const validTarget = isAddress(debounced, { strict: false })

  useEffect(() => {
    if (!validTarget) {
      setLookup({ status: 'idle' })
      return undefined
    }
    let cancelled = false
    setLookup({ status: 'loading' })
    publicClient
      .readContract({ ...registry, functionName: 'hasRole', args: [ROLES.issuer, debounced] })
      .then((isIssuer) => {
        if (!cancelled) setLookup({ status: 'done', isIssuer })
      })
      .catch((error) => {
        if (!cancelled) setLookup({ status: 'error', message: errorMessage(error) })
      })
    return () => {
      cancelled = true
    }
  }, [debounced, validTarget, tick])

  const act = async (functionName) => {
    setActing(functionName)
    const receipt = await send(functionName, [ROLES.issuer, debounced], {
      title: functionName === 'grantRole' ? 'ISSUER_ROLE otorgado' : 'ISSUER_ROLE retirado',
      text: `Cuenta ${shortHex(debounced, 10, 6)}`,
    })
    setActing(null)
    if (receipt) {
      setTick((t) => t + 1)
      onRolesChanged?.()
    }
  }

  const ready = validTarget && lookup.status === 'done' && !pending

  return (
    <section id="admin" className="section" aria-labelledby="admin-title">
      <h2 id="admin-title" className="section__title">
        <Underlined>Panel de admin</Underlined> <span className="muted small">emisores</span>
      </h2>
      <div className="sketch">
        <form className="stack" onSubmit={(e) => e.preventDefault()}>
          <Field
            id="admin-target"
            label="Dirección del emisor"
            kind="address"
            pattern={ADDRESS_PATTERN}
            placeholder="0x…"
            required
            autoComplete="off"
            spellCheck={false}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            error="Dirección Ethereum inválida (0x + 40 hex)."
          />
          <p className="preview small" aria-live="polite">
            {lookup.status === 'loading' && <><Spinner /> Consultando el rol…</>}
            {lookup.status === 'done' && (lookup.isIssuer ? 'Esta dirección ya es emisor.' : 'Esta dirección no tiene ISSUER_ROLE.')}
            {lookup.status === 'error' && <span className="text-seal">{lookup.message}</span>}
            {lookup.status === 'idle' && <span className="muted">Escribe una dirección para ver su rol actual.</span>}
          </p>
          <div className="row">
            <Button
              onClick={() => act('grantRole')}
              loading={acting === 'grantRole'}
              disabled={!ready || lookup.isIssuer}
            >
              Otorgar ISSUER_ROLE
            </Button>
            <Button
              variant="danger"
              onClick={() => act('revokeRole')}
              loading={acting === 'revokeRole'}
              disabled={!ready || !lookup.isIssuer}
            >
              Quitar ISSUER_ROLE
            </Button>
          </div>
        </form>
        <TxResult result={result} />
      </div>
    </section>
  )
}
