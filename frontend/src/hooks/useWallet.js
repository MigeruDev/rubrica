import { useCallback, useEffect, useMemo, useState } from 'react'
import { createWalletClient, custom, getAddress } from 'viem'
import { ANVIL_CHAIN_ID, chain } from '../contract.js'
import { isUserRejected } from '../lib/errors.js'

const HEX_CHAIN = `0x${ANVIL_CHAIN_ID.toString(16)}`

function normalize(accounts) {
  const first = accounts?.[0]
  return first ? getAddress(first) : null
}

/** Conexión EIP-1193 (MetaMask): cuenta, chain, cambio de cuenta/red y walletClient de viem. */
export function useWallet() {
  const [provider, setProvider] = useState(() => (typeof window !== 'undefined' ? window.ethereum : undefined))
  const hasProvider = Boolean(provider)

  // Wallets que se inyectan tarde avisan con este evento (convención EIP-1193 / MetaMask).
  useEffect(() => {
    const onInit = () => setProvider(window.ethereum)
    window.addEventListener('ethereum#initialized', onInit)
    return () => window.removeEventListener('ethereum#initialized', onInit)
  }, [])
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!provider) return undefined
    const onAccounts = (accounts) => setAccount(normalize(accounts))
    const onChain = (id) => setChainId(Number(id))
    provider.on?.('accountsChanged', onAccounts)
    provider.on?.('chainChanged', onChain)
    provider.request({ method: 'eth_accounts' }).then(onAccounts).catch(() => {})
    provider.request({ method: 'eth_chainId' }).then(onChain).catch(() => {})
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts)
      provider.removeListener?.('chainChanged', onChain)
    }
  }, [provider])

  const connect = useCallback(async () => {
    if (!provider) return
    setConnecting(true)
    setError(null)
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      setAccount(normalize(accounts))
      const id = await provider.request({ method: 'eth_chainId' })
      setChainId(Number(id))
    } catch (e) {
      setError(isUserRejected(e) ? 'Conexión cancelada en la wallet.' : e?.message ?? String(e))
    } finally {
      setConnecting(false)
    }
  }, [provider])

  const switchToAnvil = useCallback(async () => {
    if (!provider) return
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HEX_CHAIN }] })
    } catch (e) {
      if (e?.code !== 4902) throw e
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: HEX_CHAIN,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls.default.http,
        }],
      })
    }
  }, [provider])

  const walletClient = useMemo(
    () => (provider && account ? createWalletClient({ account, chain, transport: custom(provider) }) : null),
    [provider, account],
  )

  const wrongChain = Boolean(account) && chainId != null && chainId !== ANVIL_CHAIN_ID

  return { hasProvider, account, chainId, wrongChain, connecting, error, connect, switchToAnvil, walletClient }
}
