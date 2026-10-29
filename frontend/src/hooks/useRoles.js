import { useCallback, useEffect, useState } from 'react'
import { ROLES, publicClient, registry } from '../contract.js'

const NONE = { admin: false, issuer: false, loading: false, error: null }

/** Detección de rol (solo UX: la seguridad la impone el contrato). */
export function useRoles(account) {
  const [state, setState] = useState(NONE)

  const refresh = useCallback(async () => {
    if (!account || !registry.address) {
      setState(NONE)
      return
    }
    setState((s) => ({ ...s, loading: true }))
    try {
      const [admin, issuer] = await Promise.all([
        publicClient.readContract({ ...registry, functionName: 'hasRole', args: [ROLES.admin, account] }),
        publicClient.readContract({ ...registry, functionName: 'hasRole', args: [ROLES.issuer, account] }),
      ])
      setState({ admin, issuer, loading: false, error: null })
    } catch (error) {
      setState({ ...NONE, error })
    }
  }, [account])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}
