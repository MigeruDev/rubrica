import { useRef, useState } from 'react'
import { fmtBytes } from '../../lib/hash.js'

/**
 * Zona de arrastre + <input type=file> nativo (accesible por clic y teclado).
 * El drop solo asigna `files` del input; el hash se calcula al enviar.
 */
export function FileDrop({
  id,
  label = 'Documento',
  file,
  onFile,
  required = true,
  accept,
  error = 'Selecciona el documento.',
}) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const errorId = `${id}-error`

  const sync = (event) => {
    const el = event.currentTarget
    el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false')
  }

  const onChange = (event) => onFile(event.target.files?.[0] ?? null)

  const onDrop = (event) => {
    event.preventDefault()
    setOver(false)
    const dropped = event.dataTransfer.files?.[0]
    if (!dropped) return
    const transfer = new DataTransfer()
    transfer.items.add(dropped)
    inputRef.current.files = transfer.files
    onFile(dropped)
    inputRef.current.setAttribute('aria-invalid', 'false')
  }

  const clear = () => {
    inputRef.current.value = ''
    onFile(null)
  }

  return (
    <div
      className={`filedrop ${over ? 'filedrop--over' : ''} ${file ? 'filedrop--filled' : ''}`.trim()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <label htmlFor={id} className="field__label">{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="filedrop__input"
        required={required}
        accept={accept}
        aria-describedby={errorId}
        onChange={onChange}
        onBlur={sync}
        onInvalid={(e) => e.currentTarget.setAttribute('aria-invalid', 'true')}
      />
      <p id={errorId} className="field__error">↳ {error}</p>
      {file ? (
        <p className="filedrop__file">
          <span className="filedrop__name">{file.name}</span>
          <span className="muted small">{fmtBytes(file.size)}</span>
          <button type="button" className="copy" onClick={clear}>quitar</button>
        </p>
      ) : (
        <p className="filedrop__hint muted small" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 3.5h7l4 4v12.8c0 .4-.4.7-.8.7H6.6c-.4 0-.7-.3-.7-.7V4.2c0-.4.3-.7.6-.7z" />
            <path d="M13.3 3.6v4.1h4.1M9 12.2h6.2M9 15.4h5" />
          </svg>
          o arrastra el PDF aquí
        </p>
      )}
    </div>
  )
}
