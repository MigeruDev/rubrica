import { useEffect, useState } from 'react'
import { parseEventLogs } from 'viem'
import { abi, publicClient, registry } from '../../contract.js'
import { courseToId, hashFile, isAddress, shortHex } from '../../lib/hash.js'
import { errorMessage, isRevert } from '../../lib/errors.js'
import { useTx } from '../../hooks/useTx.js'
import { useDebouncedValue } from '../../hooks/useDebounce.js'
import { Button } from '../atoms/Button.jsx'
import { CopyButton } from '../atoms/CopyButton.jsx'
import { Spinner } from '../atoms/Spinner.jsx'
import { Underlined } from '../atoms/Underline.jsx'
import { CircleScribble } from '../atoms/Illustration.jsx'
import { Field } from '../molecules/Field.jsx'
import { FileDrop } from '../molecules/FileDrop.jsx'
import { ResultCard } from '../molecules/ResultCard.jsx'
import { TxResult } from '../molecules/TxResult.jsx'

export const ADDRESS_PATTERN = '^0x[a-fA-F0-9]{40}$'

function IssueCard({ walletClient, account, onChanged }) {
  const [student, setStudent] = useState('')
  const [course, setCourse] = useState('')
  const [file, setFile] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [issued, setIssued] = useState(null)
  const { send, pending, result, setResult } = useTx({ walletClient, account })

  const issue = async (event) => {
    event.preventDefault()
    if (!file) return
    const target = student.trim()
    if (!isAddress(target, { strict: false })) {
      setResult({ ok: false, title: 'Dirección inválida', text: 'Dirección Ethereum inválida (0x + 40 hex).' })
      return
    }
    setIssued(null)
    const documentHash = await hashFile(file)
    const receipt = await send('issueCertificate', [target, courseToId(course), documentHash], {
      title: 'Certificado emitido',
    })
    if (!receipt) return
    const [log] = parseEventLogs({ abi, logs: receipt.logs, eventName: 'CertificateIssued' })
    setResult(null)
    setIssued({ id: log.args.id, hash: receipt.transactionHash, student: target, course: course.trim() })
    setStudent('')
    setCourse('')
    setFile(null)
    setFormKey((k) => k + 1)
    onChanged?.()
  }

  return (
    <div className="sketch">
      <h3 className="card__title">Emitir</h3>
      <form key={formKey} className="stack" onSubmit={issue}>
        <Field
          id="issue-student"
          label="Dirección del estudiante"
          kind="address"
          pattern={ADDRESS_PATTERN}
          placeholder="0x…"
          required
          autoComplete="off"
          spellCheck={false}
          value={student}
          onChange={(e) => setStudent(e.target.value)}
          error="Dirección Ethereum inválida (0x + 40 hex)."
        />
        <Field
          id="issue-course"
          label="Código del curso"
          hint="Se guarda su keccak256, p. ej. SOLIDITY-101"
          required
          autoComplete="off"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          error="Escribe el código, p. ej. SOLIDITY-101."
        />
        <FileDrop
          id="issue-file"
          label="Documento del certificado"
          file={file}
          onFile={setFile}
          error="Selecciona el documento a emitir."
        />
        <div className="row">
          <Button type="submit" loading={pending} disabled={!student || !course.trim() || !file}>Emitir</Button>
        </div>
      </form>
      <TxResult result={result} />
      {issued && (
        <div className="txresult txresult--ok issued" role="status">
          <p className="txresult__title"><span aria-hidden="true">✓</span> Certificado emitido</p>
          <p className="issued__label">Entrega este ID al estudiante:</p>
          <CircleScribble className="bigid">
            <span className="bigid__n">{String(issued.id)}</span>
          </CircleScribble>
          <p className="small muted">
            {issued.course} · <span className="mono">{shortHex(issued.student)}</span>
          </p>
          <p className="txresult__hash small">
            tx <span className="mono">{shortHex(issued.hash, 10, 8)}</span> <CopyButton value={issued.hash} />
          </p>
        </div>
      )}
    </div>
  )
}

function RevokeCard({ walletClient, account, onChanged }) {
  const [id, setId] = useState('')
  const [tick, setTick] = useState(0)
  const debouncedId = useDebouncedValue(id.trim(), 350)
  const [preview, setPreview] = useState({ status: 'idle' })
  const { send, pending, result } = useTx({ walletClient, account })

  // Previsualiza getCertificate(id) para que el emisor confirme qué revoca.
  useEffect(() => {
    if (!/^\d+$/.test(debouncedId) || BigInt(debouncedId) < 1n) {
      setPreview({ status: 'idle' })
      return undefined
    }
    const certId = BigInt(debouncedId)
    let cancelled = false
    setPreview({ status: 'loading' })
    publicClient
      .readContract({ ...registry, functionName: 'getCertificate', args: [certId] })
      .then(([cert, valid]) => {
        if (!cancelled) setPreview({ status: 'found', id: certId, cert, valid })
      })
      .catch((error) => {
        if (cancelled) return
        setPreview(
          isRevert(error, 'CertificateNotFound')
            ? { status: 'notfound', id: certId }
            : { status: 'error', message: errorMessage(error) },
        )
      })
    return () => {
      cancelled = true
    }
  }, [debouncedId, tick])

  const revoke = async (event) => {
    event.preventDefault()
    const receipt = await send('revokeCertificate', [BigInt(id)], { title: `Certificado #${id} revocado` })
    if (receipt) {
      setTick((t) => t + 1)
      onChanged?.()
    }
  }

  const canRevoke = preview.status === 'found' && preview.valid

  return (
    <div className="sketch">
      <h3 className="card__title">Revocar</h3>
      <form className="stack" onSubmit={revoke}>
        <Field
          id="revoke-id"
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
        <div className="preview" aria-live="polite">
          {preview.status === 'loading' && <p className="muted small"><Spinner /> Buscando el certificado…</p>}
          {preview.status === 'found' && (
            <ResultCard compact id={preview.id} variant={preview.valid ? 'valid' : 'revoked'} cert={preview.cert} />
          )}
          {preview.status === 'notfound' && <p className="muted small">No existe un certificado con ese ID.</p>}
          {preview.status === 'error' && <p className="small text-seal">{preview.message}</p>}
        </div>
        <div className="row">
          <Button type="submit" variant="danger" loading={pending} disabled={!canRevoke}>
            Revocar {canRevoke ? `#${String(preview.id)}` : ''}
          </Button>
          {preview.status === 'found' && !preview.valid && <span className="muted small">Ya estaba revocado.</span>}
        </div>
      </form>
      <TxResult result={result} />
    </div>
  )
}

/** Panel de emisor: dos tarjetas lado a lado que colapsan a columna en móvil. */
export function IssuePanel({ walletClient, account, onChanged }) {
  return (
    <section id="emitir" className="section" aria-labelledby="emitir-title">
      <h2 id="emitir-title" className="section__title">
        <Underlined>Panel de emisor</Underlined> <span className="muted small mono">ISSUER_ROLE</span>
      </h2>
      <div className="grid-2">
        <IssueCard walletClient={walletClient} account={account} onChanged={onChanged} />
        <RevokeCard walletClient={walletClient} account={account} onChanged={onChanged} />
      </div>
    </section>
  )
}
