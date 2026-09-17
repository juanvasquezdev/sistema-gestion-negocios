# Testing Plan — e2e de Auth y aislamiento multi-tenant

Plan aprobado por Juan el 2026-09-16. Fuente de verdad para los tests e2e del backend: qué cubren, cómo se corren y qué falta.

## Cómo correrlos

```bash
cd backend
npm run test:e2e
```

Requisitos:
- Docker arriba (`docker compose up -d`).
- La base `sistema_negocios_test` creada y migrada (ver "Base de test").
- `backend/.env.test` presente (ignorado por git; ver "Base de test").

No hace falta apagar el backend de desarrollo: los tests levantan la app en memoria (sin `listen`), así que no usan el puerto 3000.

## Base de test

Los tests **nunca** tocan `sistema_negocios` (desarrollo). Usan `sistema_negocios_test`, en el mismo contenedor de Docker.

`backend/.env.test` (no se commitea):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_negocios_test?schema=public"
JWT_SECRET=<cualquier secreto largo, solo para tests>
JWT_EXPIRES_IN=2h
NODE_ENV=test
```

Hay tres protecciones que abortan si la base no termina en `_test`:
1. `test/setup-env.ts` (antes de importar `src/`).
2. `test/global-setup.ts`, preguntando a la conexión real con `SELECT current_database()`.
3. `test/helpers/app.ts` (`crearApp`), con la misma consulta después de `app.init()`.

`.env.test` **pisa** lo que haya en `process.env`. Importar `@prisma/client` carga el `.env` de desarrollo, y `process.loadEnvFile()` no sobrescribe variables existentes; la primera corrida abortó por eso (la protección 2 lo detectó antes de conectarse).

Crear la base desde cero (PowerShell, desde `backend/`):

```powershell
docker exec sistema-negocios-db psql -U postgres -c "CREATE DATABASE sistema_negocios_test;"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sistema_negocios_test?schema=public"
npx prisma migrate status   # debe decir database "sistema_negocios_test"
npx prisma migrate deploy   # solo si el paso anterior lo confirmó
Remove-Item Env:DATABASE_URL
```

Con migraciones nuevas: repetir los tres últimos pasos. Los roles (`ADMIN`, `VENDEDOR`) los crea `globalSetup` con upsert; no hace falta `prisma db seed`.

## Configuración

- `src/configurar-app.ts`: pipes, filtros, helmet, `trust proxy` y cookieParser, compartidos por `main.ts` y los tests (commit `bb1e53f`). Los tests corren con la misma validación que producción.
- `test/jest-e2e.json`: `setupFiles`, `globalSetup`, `moduleNameMapper` para los imports `src/...` y `testTimeout` de 30 s.
- `npm run test:e2e` = `node --experimental-vm-modules node_modules/jest/bin/jest.js --config ./test/jest-e2e.json --runInBand`.
  - **`--experimental-vm-modules`:** `@nestjs/mapped-types@12` (usado por los DTOs de actualizar) es solo ESM. Jest 30 solo puede hacer `require()` de ESM con Node 24.9+ **y** ese flag. Imprime un `ExperimentalWarning`; es esperado. Si se baja `@nestjs/mapped-types` a 2.x (CommonJS, compatible con Nest 11), el flag deja de hacer falta.
  - **`--runInBand`:** un archivo a la vez sobre la misma base, sin pisadas.

## Datos y limpieza

- Negocios con prefijo `[e2e]` + id de corrida; emails `...-<idCorrida>@e2e.test`.
- Usuarios creados con Prisma (no hay endpoint para crear un VENDEDOR), bcrypt con costo 4.
- `afterAll` de cada archivo: `limpiarNegocios()` borra solo sus negocios, en orden de FK.
- `globalSetup`: borra negocios `[e2e]` que hayan quedado de una corrida cortada.

## Rate limit

`POST /auth/login` permite 5 intentos por minuto por IP, con el contador en memoria **por instancia de la app**.
- Los tokens que no son objeto del test salen de `obtenerToken()` (`AuthService.login` real, sin HTTP).
- `auth.e2e-spec.ts` hace 3 logins por HTTP en su describe principal.
- El caso del 429 usa una app aparte.

## Casos

### Auth — `test/auth.e2e-spec.ts`
- [x] Login válido: 200, `accessToken`, `usuario` (email, rol, negocioId), cookie `token` HttpOnly.
- [x] El token autentica por cookie y por `Authorization: Bearer` (`GET /auth/perfil` 200).
- [x] Contraseña incorrecta: 401.
- [x] Endpoint protegido sin token (`GET /productos`): 401.
- [x] VENDEDOR en endpoint solo ADMIN (`DELETE /productos/:id`): 403 y el producto sigue existiendo.
- [x] Usuario desactivado: `GET /auth/perfil` con token emitido antes: 401.
- [x] Usuario desactivado: login: 401.
- [x] **T4** (commit `887fcbb`): usuario desactivado en endpoint de negocio (`GET /productos`) con un token emitido antes: 401 "Sesión inválida." (era `test.failing`).
- [x] Usuario reactivado: el mismo token vuelve a funcionar (documenta que T4 no es revocación real).
- [x] Cambio de rol con el mismo token, VENDEDOR → ADMIN: `/proveedores` pasa de 403 a 200 y `/auth/perfil` devuelve `rol: 'ADMIN'`.
- [x] Cambio de rol con el mismo token, ADMIN → VENDEDOR: `/proveedores` pasa de 200 a 403.
- [x] Rate limit (app aparte): 5 intentos 401, el 6.º 429 con "Demasiados intentos. Espera un minuto e intenta de nuevo."

### Aislamiento multi-tenant — `test/aislamiento.e2e-spec.ts`
Negocios A y B, cada uno con su ADMIN; cada uno crea categoría, producto y cliente por la API.
- [x] B pide producto de A por id: GET 404, PATCH 404 (sin cambios en base), DELETE 404 (sigue existiendo).
- [x] B pide cliente de A por id: GET 404, PATCH 404 (sin cambios en base), DELETE 404 (sigue existiendo).
- [x] Listados de B (`/productos`, `/productos/selector`, `/clientes`, `/clientes/selector`): solo datos de B, `total` 1.
- [x] B envía `negocioId` de A en `POST /clientes` y `POST /productos`: 400 (`property negocioId should not exist`), nada creado en ningún negocio.
- [x] B envía `negocioId` de A en `PATCH` de su propio cliente: 400, sigue en B y sin cambios.
- [x] Venta de B con cliente de A: 400.
- [x] Venta de B con producto de A: 400, sin ventas creadas y sin tocar el stock de A.

Nota: hoy el `negocioId` del body **no se ignora, se rechaza con 400** (`forbidNonWhitelisted`). Si algún día cambia la configuración del `ValidationPipe`, estos tests lo detectan.

### Pendiente (no cubierto todavía)
- [ ] Aislamiento en Proveedor, Categoría, Venta (GET por id), Deuda (GET y abono) y Resumen.
- [ ] Matriz de roles completa (hoy solo un caso representativo de 403).
- [ ] `registrar-negocio` (201, email duplicado 409).

## Reglas
- Si un test de aislamiento falla de forma inesperada, **no ajustarlo para que pase**: puede ser una fuga real. Detenerse y revisar.
- No agregar logins por HTTP en el describe principal de `auth.e2e-spec.ts` por encima de 5.
