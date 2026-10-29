import { Button } from '../atoms/Button.jsx'
import { Underlined } from '../atoms/Underline.jsx'
import { AddressChip } from '../molecules/AddressChip.jsx'

function plural(n) {
  return n === 1n ? '1 certificado trazado' : `${String(n)} certificados trazados`
}

/** Logo + contador + conexión. Sin menú: la app es una sola página. */
export function Header({ totalIssued, wallet, roles }) {
  return (
    <header className="header container">
      <a href="#top" className="header__logo"><Underlined>Rúbrica</Underlined></a>
      <div className="header__meta">
        {totalIssued != null && <span className="header__count muted small">{plural(totalIssued)}</span>}
        {wallet.account ? (
          <AddressChip address={wallet.account} roles={roles} />
        ) : wallet.hasProvider ? (
          <Button variant="secondary" onClick={wallet.connect} loading={wallet.connecting}>Conectar wallet</Button>
        ) : (
          <span className="muted small">sin wallet · solo verificación</span>
        )}
      </div>
    </header>
  )
}
