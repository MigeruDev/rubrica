import { useState } from 'react'
import { ANVIL_CHAIN_ID } from '../../contract.js'
import { RPC_DOWN_MESSAGE, errorMessage } from '../../lib/errors.js'
import { Button } from '../atoms/Button.jsx'

/** Estados globales: RPC caído y wallet en otra red. */
export function ChainBanner({ rpcOk, wallet }) {
  const [switching, setSwitching] = useState(false)
  const [switchError, setSwitchError] = useState(null)

  if (rpcOk !== false && !wallet.wrongChain) return null

  const onSwitch = async () => {
    setSwitching(true)
    setSwitchError(null)
    try {
      await wallet.switchToAnvil()
    } catch (error) {
      setSwitchError(errorMessage(error))
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="banners">
      {rpcOk === false && (
        <p className="banner" role="alert">
          <span aria-hidden="true">✗</span> {RPC_DOWN_MESSAGE} Arranca <code>anvil</code> y despliega el contrato.
        </p>
      )}
      {wallet.wrongChain && (
        <div className="banner" role="alert">
          <span>
            Tu wallet está en otra red (chainId {wallet.chainId}). Rúbrica vive en Anvil ({ANVIL_CHAIN_ID}).
          </span>
          <Button variant="secondary" onClick={onSwitch} loading={switching}>Cambiar a Anvil</Button>
          {switchError && <span className="small">{switchError}</span>}
        </div>
      )}
    </div>
  )
}
