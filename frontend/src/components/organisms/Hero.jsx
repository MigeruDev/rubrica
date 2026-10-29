import { Button } from '../atoms/Button.jsx'
import { Underlined } from '../atoms/Underline.jsx'
import { HeroIllustration, StepIcon } from '../atoms/Illustration.jsx'

const STEPS = [
  {
    icon: 'hash',
    title: 'Se hashea en tu navegador',
    text: 'El PDF se convierte en un keccak256 localmente. El archivo no se sube a ningún servidor.',
  },
  {
    icon: 'chain',
    title: 'Se compara on-chain',
    text: 'Leemos el certificado del contrato y cotejamos el hash. Sin wallet: solo una lectura al RPC.',
  },
  {
    icon: 'stamp',
    title: 'Sello al instante',
    text: 'Válido, revocado, no coincide o no existe. Un sello, sin ambigüedad.',
  },
]

function counterText(total) {
  if (total == null) return 'contando certificados…'
  return total === 1n ? '1 certificado trazado hasta hoy' : `${String(total)} certificados trazados hasta hoy`
}

export function Hero({ totalIssued, wallet }) {
  return (
    <section className="hero-wrap" aria-labelledby="hero-title">
      <div className="hero">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title rough"><Underlined>Rúbrica</Underlined></h1>
          <p className="hero__tagline">Certificados trazados en cadena.</p>
          <p className="hero__lead">
            La rúbrica es el trazo que valida un documento. Aquí ese trazo vive en la cadena: una
            institución emite el certificado y cualquiera lo verifica sin confiar en nadie.
          </p>
          <p className="hero__counter" aria-live="polite">{counterText(totalIssued)}</p>
          <div className="row">
            <Button href="#verificar">Verificar un certificado</Button>
            {!wallet.account && wallet.hasProvider && (
              <Button variant="secondary" onClick={wallet.connect} loading={wallet.connecting}>Conectar wallet</Button>
            )}
          </div>
        </div>
        <div className="hero__art">
          <HeroIllustration />
        </div>
      </div>
      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.icon} className="step sketch sketch--flat">
            <span className="step__n" aria-hidden="true">{i + 1}.</span>
            <StepIcon kind={step.icon} />
            <h3 className="step__title">{step.title}</h3>
            <p className="step__text muted small">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
