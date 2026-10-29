import { useState } from 'react'
import { publicClient, registry } from '../../contract.js'
import { hashFile } from '../../lib/hash.js'
import { errorMessage, isRevert } from '../../lib/errors.js'
import { Button } from '../atoms/Button.jsx'
import { Spinner } from '../atoms/Spinner.jsx'
import { Underlined } from '../atoms/Underline.jsx'
import { Field } from '../molecules/Field.jsx'
import { FileDrop } from '../molecules/FileDrop.jsx'
import { ResultCard, ResultPlaceholder } from '../molecules/ResultCard.jsx'
import { TxResult } from '../molecules/TxResult.jsx'

/** Verificación pública: sin wallet, hash local y comparación en el cliente. */
export function VerifyPanel() {
  const [id, setId] = useState('')
  const [file, setFile] = useState(null)
  const [state, setState] = useState({ status: 'idle' })

  const verify = async (event) => {
    event.preventDefault()
    if (!file || !id) return
    const certId = BigInt(id)
    setState({ status: 'loading' })
    try {
      const [lookup, hash] = await Promise.all([
        publicClient
          .readContract({ ...registry, functionName: 'getCertificate', args: [certId] })
          .then((value) => ({ value }))
          .catch((error) => ({ error })),
        hashFile(file),
      ])
      if (lookup.error) {
        if (isRevert(lookup.error, 'CertificateNotFound')) {
          setState({ status: 'done', variant: 'notfound', id: certId })
          return
        }
        throw lookup.error
      }
      const [cert, valid] = lookup.value
      // Orden: existe → hash → vigente. "Revocado con hash correcto" se reporta como REVOCADO.
      const variant = hash !== cert.documentHash ? 'mismatch' : valid ? 'valid' : 'revoked'
      setState({ status: 'done', variant, id: certId, cert })
    } catch (error) {
      setState({ status: 'error', message: errorMessage(error) })
    }
  }

  return (
    <section id="verificar" className="section" aria-labelledby="verificar-title">
      <h2 id="verificar-title" className="section__title">
        <Underlined>Verificar</Underlined> <span className="muted small">público · sin wallet</span>
      </h2>
      <div className="sketch">
        <form className="stack" onSubmit={verify}>
          <Field
            id="verify-id"
            label="ID del certificado"
            kind="id"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            placeholder="p. ej. 1"
            value={id}
            onChange={(e) => setId(e.target.value)}
            error="Los IDs empiezan en 1."
          />
          <FileDrop
            id="verify-file"
            label="Documento a verificar"
            file={file}
            onFile={setFile}
            error="Selecciona el documento a verificar."
          />
          <div className="row">
            <Button type="submit" loading={state.status === 'loading'}>Verificar</Button>
            <span className="muted small">El archivo se hashea en tu navegador; no se sube a ningún servidor.</span>
          </div>
        </form>
      </div>
      <div className="verify__result" role="status">
        {state.status === 'idle' && <ResultPlaceholder>Aquí aparecerá el resultado con su sello.</ResultPlaceholder>}
        {state.status === 'loading' && (
          <ResultPlaceholder><Spinner /> Hasheando el documento y consultando la cadena…</ResultPlaceholder>
        )}
        {state.status === 'done' && <ResultCard id={state.id} variant={state.variant} cert={state.cert} />}
        {state.status === 'error' && (
          <TxResult live={false} result={{ ok: false, title: 'No se pudo verificar', text: state.message }} />
        )}
      </div>
    </section>
  )
}
