import { useCallback, useState } from 'react'
import { publicClient, registry } from '../contract.js'
import { errorMessage } from '../lib/errors.js'

/** simulate → write → receipt, con estado de carga y resultado humano. */
export function useTx({ walletClient, account }) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState(null)

  const send = useCallback(
    async (functionName, args, { title = 'Transacción confirmada', text } = {}) => {
      setPending(true)
      setResult(null)
      try {
        const { request } = await publicClient.simulateContract({ ...registry, functionName, args, account })
        const hash = await walletClient.writeContract(request)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        setResult({ ok: true, title, text, hash })
        return receipt
      } catch (err) {
        setResult({ ok: false, title: 'No se pudo completar', text: errorMessage(err) })
        return null
      } finally {
        setPending(false)
      }
    },
    [walletClient, account],
  )

  return { send, pending, result, setResult }
}
