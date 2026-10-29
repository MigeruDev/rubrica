/** Nota contextual bajo los paneles: qué falta para ver los paneles de rol. */
export function RoleGate({ wallet, roles }) {
  let text = null
  if (!wallet.hasProvider) {
    text = 'Para emitir o administrar necesitas una wallet: instala MetaMask y conéctala a Anvil (127.0.0.1:8545, chainId 31337). La verificación pública funciona sin wallet.'
  } else if (!wallet.account) {
    text = 'Conecta tu wallet para ver los paneles de emisor y admin, si tu cuenta tiene rol.'
  } else if (wallet.wrongChain) {
    return null
  } else if (roles.loading) {
    text = 'Comprobando roles de la cuenta…'
  } else if (roles.error) {
    text = 'No se pudieron leer los roles de la cuenta. ¿Está Anvil en marcha?'
  } else if (!roles.admin && !roles.issuer) {
    text = 'Esta cuenta no tiene rol de emisor ni de admin: solo puede verificar. El admin puede otorgarle ISSUER_ROLE.'
  }
  if (!text) return null
  return (
    <p className="gate muted" role="note">
      <span aria-hidden="true">↳ </span>{text}
    </p>
  )
}
