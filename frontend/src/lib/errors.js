// Capa fina sobre los errores de viem: decodifica custom errors y los traduce a frases humanas.
import { BaseError, ContractFunctionRevertedError, HttpRequestError, UserRejectedRequestError } from 'viem'
import { RPC_URL } from '../contract.js'

const HUMAN = {
  CertificateNotFound: 'No existe un certificado con ese ID.',
  AlreadyCertified: 'Ese estudiante ya tiene un certificado vigente de ese curso. Revoca el anterior para re-emitir.',
  AlreadyRevoked: 'Ese certificado ya estaba revocado.',
  NotAllowedToRevoke: 'Solo el admin o el emisor original (con rol vigente) pueden revocar.',
  AccessControlUnauthorizedAccount: 'Tu cuenta no tiene el rol necesario.',
  ZeroAddress: 'La dirección no puede ser 0x0.',
  EmptyDocumentHash: 'El hash del documento no puede estar vacío.',
}

export const RPC_DOWN_MESSAGE = `No llego a Anvil (${RPC_URL.replace(/^https?:\/\//, '')}).`

/** { name, args } del custom error, o null si no es un revert decodificable. */
export function decodeRevert(err) {
  if (!(err instanceof BaseError)) return null
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError)
  if (!revert?.data?.errorName) return null
  return { name: revert.data.errorName, args: revert.data.args ?? [] }
}

export function isRevert(err, name) {
  return decodeRevert(err)?.name === name
}

export function isRpcDown(err) {
  return err instanceof BaseError && Boolean(err.walk((e) => e instanceof HttpRequestError))
}

export function isUserRejected(err) {
  if (err?.code === 4001) return true
  return err instanceof BaseError && Boolean(err.walk((e) => e instanceof UserRejectedRequestError))
}

/** Siempre devuelve algo legible; un error no mapeado cae al texto decodificado tal cual. */
export function errorMessage(err) {
  if (!err) return ''
  if (isUserRejected(err)) return 'Transacción cancelada en la wallet.'
  if (isRpcDown(err)) return RPC_DOWN_MESSAGE
  const revert = decodeRevert(err)
  if (revert) {
    return HUMAN[revert.name] ?? `El contrato rechazó la operación: ${revert.name}(${revert.args.map(String).join(', ')})`
  }
  return err.shortMessage ?? err.message ?? String(err)
}
