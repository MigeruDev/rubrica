# Rúbrica — Certificados trazados en cadena

Rúbrica es una dApp que emite y verifica certificados académicos contra un registro en cadena. Una institución con rol de emisor publica el `keccak256` de un documento junto con el estudiante y el curso; cualquiera, con o sin wallet, puede comprobar después si un PDF concreto corresponde a un certificado vigente. El contrato `CertificateRegistry` es la única fuente de verdad: la interfaz sugiere, el contrato manda.

## Concepto

La identidad visual es **papel de ingeniería**: trazos de tinta a mano sobre papel crema en modo claro y plano azul (blueprint) en modo oscuro. Toda la interfaz es un **duotono tinta/sello**: la tinta dibuja formularios, bordes y texto; el sello aparece solo cuando el contrato responde (VÁLIDO, REVOCADO, NO COINCIDE, NO EXISTE).

No hay verde ni semáforos. Un certificado válido no es un "éxito" de la interfaz, es un hecho que afirma el registro. Estampar el veredicto con el mismo color de tinta que el resto del papel recuerda que la respuesta viene de la cadena, no del navegador, y evita que el significado dependa solo del color: el texto del sello siempre se lee.

## Qué hay en el repo

```
.
├── foundry.toml
├── SCOPE.md
├── src/CertificateRegistry.sol          # contrato (AccessControl, ISSUER_ROLE)
├── script/Deploy.s.sol                  # despliega y concede ISSUER_ROLE al deployer
├── test/CertificateRegistry.t.sol       # unit + fuzz
├── lib/                                 # forge-std, openzeppelin-contracts
├── .github/workflows/deploy-pages.yml   # publicación en GitHub Pages
└── frontend/                            # React 19 + Vite + viem (JSX)
    ├── .env                             # VITE_CONTRACT_ADDRESS, VITE_RPC_URL
    ├── vite.config.js                   # base = process.env.VITE_BASE
    └── src/
        ├── components/{atoms,molecules,organisms}
        ├── hooks/
        ├── lib/
        └── styles/{tokens.css,sketch.css,components.css}
```

## Requisitos

- Foundry >= 1.8 (`forge`, `anvil`, `cast`)
- Node.js >= 20 y npm (el workflow de Pages usa Node 22)
- MetaMask en el navegador

## Puesta en marcha local

### 1. Contrato

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
forge build
forge test -vv
```

Los tests incluyen casos unitarios y fuzz (512 runs). `forge coverage` es opcional.

### 2. Cadena local y despliegue

Terminal 1:

```bash
anvil
```

Terminal 2, desplegando con la cuenta #0 de Anvil (clave de pruebas pública; no la uses fuera de local):

```bash
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

El script despliega `CertificateRegistry` y concede `ISSUER_ROLE` al deployer, que ya tiene `DEFAULT_ADMIN_ROLE`. En un Anvil recién arrancado la dirección es siempre `0x5FbDB2315678afecb367f032d93F642f64180aa3`.

### 3. Frontend

Copia la dirección desplegada en `frontend/.env` (los valores por defecto ya coinciden con un Anvil limpio):

```bash
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_RPC_URL=http://127.0.0.1:8545
```

```bash
cd frontend
npm install
npm run dev
```

Abre la URL que imprime Vite. El tema claro/oscuro sigue la preferencia del sistema operativo.

## Configurar MetaMask

1. Redes > Añadir red manualmente: nombre `Anvil`, RPC `http://127.0.0.1:8545`, chainId `31337`, símbolo `ETH`.
2. Importar cuenta > clave privada: pega la clave de la cuenta #0 (arriba). Repite con la #1 si vas a hacer la parte de roles de la demo.
3. Si reinicias Anvil, en MetaMask usa "Borrar datos de actividad" de la cuenta para que el nonce vuelva a cero.

## Guion de demo (~4 min)

1. **Arranque.** Terminal 1: `anvil`. Terminal 2: el `forge script` de arriba; copia la dirección a `frontend/.env`.
2. **Landing.** `cd frontend && npm install && npm run dev`. Cambia el tema del sistema para mostrar papel crema y blueprint.
3. **Sin wallet.** Verifica un ID inexistente: sello `? NO EXISTE`. Leer no exige firmar nada.
4. **Emitir.** Conecta MetaMask con la cuenta #0 (admin + emisor). Emite un certificado adjuntando un PDF: la UI muestra el ID leído del evento `CertificateIssued`.
5. **Verificar.** Mismo ID con el mismo PDF: `✓ VÁLIDO`. Con otro archivo: `✗ NO COINCIDE`. El PDF nunca salió del navegador.
6. **Revocar.** Revoca el ID y vuelve a verificar: `✗ REVOCADO`. El registro no borra, marca.
7. **Roles.** Como admin, concede `ISSUER_ROLE` a la cuenta #1. Cambia de cuenta en MetaMask: aparece el panel de emisor. Intenta revocar desde #1 el certificado emitido por #0: el contrato responde `NotAllowedToRevoke`. La UI sugiere, el contrato manda.

## Cómo funciona la verificación

1. El usuario arrastra un archivo. El navegador calcula `keccak256` de sus bytes localmente con viem; el archivo no se sube a ningún sitio.
2. La UI llama a `getCertificate(id)`, que devuelve `(cert, valid)`.
3. Se evalúa en este orden y se estampa el primer sello que aplique:
   - ¿Existe el ID? Si no: `? NO EXISTE`.
   - ¿Coincide `cert.documentHash` con el hash calculado? Si no: `✗ NO COINCIDE`.
   - ¿Está vigente (`revokedAt == 0`)? Si no: `✗ REVOCADO`.
   - Si todo pasa: `✓ VÁLIDO`.

El orden importa: antes de hablar de vigencia hay que saber que hablamos del mismo documento. Cuatro sellos, un solo camino.

Detalles del contrato que la interfaz respeta:

- Roles de OpenZeppelin AccessControl: `DEFAULT_ADMIN_ROLE` concede y revoca `ISSUER_ROLE` con `grantRole` / `revokeRole`.
- `issueCertificate(student, courseId, documentHash)`: solo emisores; `courseId = keccak256(código del curso)`; un solo certificado activo por `(student, courseId)`; los ids empiezan en 1.
- `revokeCertificate(id)`: marca `revokedAt`, nunca borra.
- `verify(id, documentHash)` devuelve `bool`; `totalIssued()` cuenta emisiones.
- Errores personalizados: `ZeroAddress`, `EmptyDocumentHash`, `AlreadyCertified`, `CertificateNotFound`, `AlreadyRevoked`, `NotAllowedToRevoke`. La UI los decodifica y los muestra tal cual.

## Despliegue en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` compila `frontend/` y publica `frontend/dist` en cada push a `main` (también se puede lanzar a mano desde la pestaña Actions). La primera vez hay que activar Pages con origen "GitHub Actions" en Settings > Pages.

URL publicada: https://migerudev.github.io/rubrica/

El build fija `VITE_BASE=/rubrica/` a partir del nombre del repositorio para que los assets resuelvan bajo el subdirectorio.

Por defecto la página publicada apunta a `http://127.0.0.1:8545` y a la dirección determinista de Anvil, así que funciona contra el Anvil local de quien la visita: cada persona que abre la URL ve su propia cadena. Chrome puede pedir permiso de "acceso a red local" la primera vez que una página servida por https intenta hablar con 127.0.0.1; hay que aceptarlo.

Para apuntar a otra red, define variables de repositorio (Settings > Secrets and variables > Actions > Variables) y vuelve a lanzar el workflow:

- `VITE_CONTRACT_ADDRESS`: dirección del `CertificateRegistry` desplegado.
- `VITE_RPC_URL`: endpoint JSON-RPC de esa red.

## Créditos

- Contrato y scaffold base: [edwinnm/Proyecto-Final-Blockchain.](https://github.com/edwinnm/Proyecto-Final-Blockchain.) (repositorio base del curso; el nombre termina en punto).
- Diseño de interfaz según el documento "Rúbrica — Diseño de vistas".
- Herramientas: Foundry, OpenZeppelin Contracts, React, Vite, viem, MetaMask.
