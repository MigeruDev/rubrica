import { Stamp } from '../atoms/Stamp.jsx'
import { CopyButton } from '../atoms/CopyButton.jsx'
import { fmtDate, shortHex } from '../../lib/hash.js'

function Row({ label, children }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{children}</td>
    </tr>
  )
}

function Hex({ value, head = 10, tail = 6 }) {
  return (
    <>
      <span className="mono">{shortHex(value, head, tail)}</span> <CopyButton value={value} />
    </>
  )
}

/** Ficha tipo "formulario sellado": pares clave/valor en mono con el Stamp superpuesto. */
export function ResultCard({ id, variant, cert, compact = false }) {
  return (
    <article className={`result sketch sketch--alt ${compact ? 'result--compact' : ''}`.trim()}>
      <Stamp variant={variant} className="result__stamp" />
      <h3 className="result__title">Certificado #{String(id)}</h3>
      {cert ? (
        <table className="result__table">
          <tbody>
            <Row label="Estudiante"><Hex value={cert.student} /></Row>
            <Row label="Emisor"><Hex value={cert.issuer} /></Row>
            <Row label="Curso">
              <Hex value={cert.courseId} /> <span className="muted small">(keccak256 del código)</span>
            </Row>
            <Row label="Documento"><Hex value={cert.documentHash} /></Row>
            <Row label="Emitido">{fmtDate(cert.issuedAt)}</Row>
            <Row label="Revocado">{cert.revokedAt ? fmtDate(cert.revokedAt) : '—'}</Row>
          </tbody>
        </table>
      ) : (
        <p className="muted">No hay ningún certificado con ese ID. Los IDs empiezan en 1.</p>
      )}
    </article>
  )
}

/** Silueta punteada del estado vacío. */
export function ResultPlaceholder({ children }) {
  return (
    <div className="result result--placeholder sketch sketch--dashed">
      <p className="muted">{children}</p>
    </div>
  )
}
