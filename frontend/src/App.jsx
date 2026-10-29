import { CONTRACT_ADDRESS } from './contract.js'
import { useWallet } from './hooks/useWallet.js'
import { useRoles } from './hooks/useRoles.js'
import { useRegistry } from './hooks/useRegistry.js'
import { shortHex } from './lib/hash.js'
import { CopyButton } from './components/atoms/CopyButton.jsx'
import { TxResult } from './components/molecules/TxResult.jsx'
import { Header } from './components/organisms/Header.jsx'
import { Hero } from './components/organisms/Hero.jsx'
import { ChainBanner } from './components/organisms/ChainBanner.jsx'
import { VerifyPanel } from './components/organisms/VerifyPanel.jsx'
import { IssuePanel } from './components/organisms/IssuePanel.jsx'
import { AdminPanel } from './components/organisms/AdminPanel.jsx'
import { RoleGate } from './components/organisms/RoleGate.jsx'

function MissingConfig() {
  return (
    <main className="container app">
      <div className="sketch notice">
        <h1>Falta la dirección del contrato</h1>
        <p>
          Copia <code>frontend/.env.example</code> a <code>frontend/.env</code> y pon en{' '}
          <code>VITE_CONTRACT_ADDRESS</code> la dirección que imprime el deploy:
        </p>
        <pre className="mono notice__cmd">forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key &lt;clave anvil #0&gt;</pre>
        <p className="muted">Luego reinicia <code>npm run dev</code>.</p>
      </div>
    </main>
  )
}

export default function App() {
  const wallet = useWallet()
  const roles = useRoles(wallet.account)
  const chain = useRegistry()

  if (!CONTRACT_ADDRESS) return <MissingConfig />

  const canWrite = Boolean(wallet.account && wallet.walletClient && !wallet.wrongChain)

  return (
    <>
      <a className="skip-link" href="#verificar">Saltar a verificar</a>
      <Header totalIssued={chain.totalIssued} wallet={wallet} roles={roles} />
      <main id="top" className="container app">
        <ChainBanner rpcOk={chain.rpcOk} wallet={wallet} />
        {wallet.error && <TxResult result={{ ok: false, title: 'Wallet', text: wallet.error }} />}
        <Hero totalIssued={chain.totalIssued} wallet={wallet} />
        <VerifyPanel />
        {canWrite && roles.issuer && (
          <IssuePanel walletClient={wallet.walletClient} account={wallet.account} onChanged={chain.refresh} />
        )}
        {canWrite && roles.admin && (
          <AdminPanel walletClient={wallet.walletClient} account={wallet.account} onRolesChanged={roles.refresh} />
        )}
        <RoleGate wallet={wallet} roles={roles} />
      </main>
      <footer className="container footer muted small">
        <span>Rúbrica · el documento nunca sale del navegador.</span>
        <span>
          Contrato <span className="mono">{shortHex(CONTRACT_ADDRESS)}</span> <CopyButton value={CONTRACT_ADDRESS} /> en Anvil 31337
        </span>
      </footer>
    </>
  )
}
