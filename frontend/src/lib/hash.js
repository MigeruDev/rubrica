import { keccak256, stringToBytes } from 'viem'

export { isAddress } from 'viem'

/** keccak256 del archivo, calculado en el navegador: el documento nunca sale del cliente. */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer()
  return keccak256(new Uint8Array(buffer))
}

/** courseId = keccak256(código). El texto del curso no vive on-chain. */
export function courseToId(code) {
  return keccak256(stringToBytes(code.trim()))
}

export function fmtDate(ts) {
  const seconds = Number(ts)
  if (!seconds) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(seconds * 1000))
}

/** 0x1234…abcd */
export function shortHex(hex, head = 6, tail = 4) {
  if (!hex) return ''
  return hex.length <= head + tail + 1 ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`
}

export function fmtBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
