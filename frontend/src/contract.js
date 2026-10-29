// Superficie del contrato CertificateRegistry (Foundry + OpenZeppelin AccessControl) en Anvil.
// No hay servidor ni base de datos: todo el front habla con el RPC vía viem.
import { createPublicClient, defineChain, http, keccak256, parseAbi, stringToBytes, zeroHash } from 'viem'

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'
export const ANVIL_CHAIN_ID = 31337

export const chain = defineChain({
  id: ANVIL_CHAIN_ID,
  name: 'Anvil (local)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
})

// ABI legible: funciones, eventos y errores (los errores permiten decodificar reverts).
export const abi = parseAbi([
  'function ISSUER_ROLE() view returns (bytes32)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function totalIssued() view returns (uint256)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getCertificate(uint256 id) view returns ((address student, address issuer, uint64 issuedAt, uint64 revokedAt, bytes32 courseId, bytes32 documentHash) cert, bool valid)',
  'function verify(uint256 id, bytes32 documentHash) view returns (bool)',
  'function issueCertificate(address student, bytes32 courseId, bytes32 documentHash) returns (uint256 id)',
  'function revokeCertificate(uint256 id)',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
  'event CertificateIssued(uint256 indexed id, address indexed student, bytes32 indexed courseId, address issuer, bytes32 documentHash)',
  'event CertificateRevoked(uint256 indexed id, address indexed revokedBy)',
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
  'error ZeroAddress()',
  'error EmptyDocumentHash()',
  'error AlreadyCertified(address student, bytes32 courseId)',
  'error CertificateNotFound(uint256 id)',
  'error AlreadyRevoked(uint256 id)',
  'error NotAllowedToRevoke(uint256 id, address caller)',
  'error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)',
  'error AccessControlBadConfirmation()',
])

// Constantes de rol (idénticas a las del contrato; se calculan en cliente para ahorrar RPCs).
export const ROLES = {
  admin: zeroHash,
  issuer: keccak256(stringToBytes('ISSUER_ROLE')),
}

export const publicClient = createPublicClient({ chain, transport: http(RPC_URL) })

// Par { address, abi } listo para spread en readContract / simulateContract.
export const registry = { address: CONTRACT_ADDRESS, abi }
