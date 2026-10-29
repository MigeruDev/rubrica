import { useCallback, useEffect, useState } from 'react'
import { publicClient, registry } from '../contract.js'

/** Salud del RPC + contador totalIssued para la landing y el header. */
export function useRegistry() {
  const [state, setState] = useState({ rpcOk: null, totalIssued: null, error: null })

  const refresh = useCallback(async () => {
    if (!registry.address) return
    try {
      const total = await publicClient.readContract({ ...registry, functionName: 'totalIssued' })
      setState({ rpcOk: true, totalIssued: total, error: null })
    } catch (error) {
      setState((s) => ({ rpcOk: false, totalIssued: s.totalIssued, error }))
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 15_000)
    return () => clearInterval(timer)
  }, [refresh])

  return { ...state, refresh }
}
