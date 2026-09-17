# Security Backlog — Fast Inventory

> **Estado (2026-09-16):** T0-T3 cerrados. **T4 abierto** (usuario desactivado sigue operando hasta 2 h), a resolver antes de la Fase 3 del Superadmin. Tests e2e de auth y aislamiento: `TESTING-PLAN.md`.

Auditoría de seguridad del backend. Reconstruido el 2026-09-09 tras verificar directamente el código en el repo (no por reporte de terceros).

## Cerrado

### T1 — Rate limiting en auth (login + registrar-negocio)
**Estado: COMPLETO**, verificado en código el 2026-09-09.

- `@nestjs/throttler` instalado (`backend/package.json`).
- `ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 5 }])` registrado en `app.module.ts`. Sin `APP_GUARD` global — el guard solo aplica donde se usa `@UseGuards(ThrottlerGuard)` explícito, así que el resto de la API (Cliente, Producto, Venta, etc.) NO queda limitado por accidente.
- `POST /auth/login` y `POST /auth/registrar-negocio`: ambos con `@UseGuards(ThrottlerGuard)` + `@Throttle({ default: { limit: 5, ttl: 60000 } })` (5 intentos/minuto por IP).
- `app.set('trust proxy', 1)` en `main.ts` — IP real detectada correctamente detrás del proxy de Railway (necesario para que el límite sea por IP real, no por la IP del proxy).
- `ThrottlerExceptionFilter` (`backend/src/common/throttler-exception.filter.ts`) registrado globalmente en `main.ts` vía `app.useGlobalFilters(...)`. Devuelve 429 con mensaje en español: "Demasiados intentos. Espera un minuto e intenta de nuevo."

No se requieren más cambios para T1.

### T2 — Helmet (headers de seguridad HTTP)
**Estado: COMPLETO**, verificado en código y en respuestas HTTP reales el 2026-09-09.

- `helmet` instalado (`backend/package.json`).
- `app.use(helmet())` en `main.ts` (desde el commit `bb1e53f` vive en `src/configurar-app.ts`, compartido por `main.ts` y los tests e2e), como primera línea tras crear la app — antes de `trust proxy`, los pipes/filters globales, `cookieParser` y `enableCors`.
- Verificado con `curl` que las respuestas ahora incluyen `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `X-DNS-Prefetch-Control`, entre otros.
- Confirmado que no rompe nada existente: login (`POST /auth/login`) sigue devolviendo `200` y `Access-Control-Allow-Origin` sigue presente para el origen del frontend (CORS no afectado por Helmet).

### T3 — `.env.example`
**Estado: COMPLETO**, verificado el 2026-09-09.

- Creado `backend/.env.example` con placeholders (sin valores reales) para las 5 variables que el código realmente lee: `DATABASE_URL` (usada por Prisma vía `env()` en `schema.prisma`), `JWT_SECRET` y `JWT_EXPIRES_IN` (vía `ConfigService.get(...)` en `auth.module.ts` / `jwt.strategy.ts`), y `NODE_ENV` / `PORT` (vía `process.env` directo en `auth.controller.ts` / `main.ts`).
- Contrastado contra las claves reales del `.env` local: coinciden exactamente, sin variables inventadas ni faltantes.

### T0 — RolesGuard explícito en Venta y Deuda
Commit `ebd2726` (no documentado hasta ahora). Verificado: es hardening defensivo, no un cambio funcional — antes solo tenían `JwtAuthGuard` (cualquier usuario autenticado podía acceder), y como los únicos roles del sistema son `ADMIN` y `VENDEDOR`, agregar `@Roles('ADMIN', 'VENDEDOR')` no cambia el comportamiento real, solo lo hace explícito y a prueba de futuros roles nuevos.

### Matriz de autorización — verificada completa y consistente
Confirmado en código (no solo en docs) que los 5 módulos + resumen tienen exactamente esta matriz:

| Módulo | Ver/Listar | Crear | Editar/Eliminar |
|---|---|---|---|
| Cliente | cualquiera autenticado | cualquiera | solo ADMIN |
| Producto | cualquiera | solo ADMIN | solo ADMIN |
| Categoria | solo ADMIN | solo ADMIN | solo ADMIN |
| Proveedor | solo ADMIN | solo ADMIN | solo ADMIN |
| Venta | ADMIN, VENDEDOR | ADMIN, VENDEDOR | — (no hay editar/eliminar) |
| Deuda | ADMIN, VENDEDOR | — (se genera automático) | abono: ADMIN, VENDEDOR |
| Resumen | cualquiera autenticado | — | — |

Todos los controladores usan `@UseGuards(JwtAuthGuard, RolesGuard)` a nivel de clase. Ninguno quedó sin guard.

### Multi-tenancy — verificado sin fugas
Revisado uso de `negocioId` en los 7 servicios (`cliente`, `producto`, `categoria`, `proveedor`, `venta`, `deuda`, `resumen`). Todas las queries filtran por `negocioId` (patrón `findFirst({ where: { id, negocioId } })` o `findMany({ where: { negocioId } })`). Único `findUnique` fuera de `auth/` es en `producto.service.ts` dentro de una transacción, sobre un `id` generado por Prisma en la misma transacción (no viene del cliente) — sin riesgo.

### Autenticación — verificado sólido
- Passwords con `bcrypt`, 12 salt rounds.
- JWT: secret desde `.env` (`JWT_SECRET`), sin valor por defecto (falla si falta — correcto). Expiración 2h, `ignoreExpiration: false`.
- Cookie `token`: `httpOnly: true`, `secure: true` en producción, `sameSite: 'none'` en producción / `'lax'` en dev. Fallback a header `Authorization: Bearer` para Postman/testing.
- Login y registro no filtran si el email existe vía mensaje de error (login usa "Credenciales inválidas" genérico). Registro sí informa "ya existe un usuario con ese email" (enumeración de email en registro) — riesgo bajo, aceptable para v1.
- `.env` correctamente en `.gitignore`, no hay secretos commiteados.
- `ValidationPipe` global con `whitelist + forbidNonWhitelisted + transform`.
- CORS restringido a orígenes explícitos (`localhost:3001` + dominio de Vercel), `credentials: true`.

## Pendiente — gaps reales encontrados

### T4 — Usuario desactivado sigue operando hasta que vence su token (2 h)
**Estado: ABIERTO**, encontrado el 2026-09-16 durante la inspección para los tests e2e. **Sin implementar el arreglo.**

**Prioridad:** resolver **antes de la Fase 3 del Panel de Superadmin**. Suspender un negocio tendría exactamente el mismo hueco: sus usuarios seguirían operando con el token que ya tienen.

- **Qué pasa:** `JwtStrategy.validate()` (`src/auth/jwt.strategy.ts`) arma el usuario solo con el payload del JWT, sin consultar la base. Si se pone `activo = false`, un token emitido antes sigue siendo válido para toda la API (`/productos`, `/ventas`, `/deudas`, etc. de su propio negocio) hasta que expira.
- **Qué sí lo bloquea hoy:** `POST /auth/login` (401) y `GET /auth/perfil` (401, `auth.service.ts::perfil`). Por eso el dashboard lo saca de la interfaz, pero la API sigue abierta.
- **No es una fuga entre negocios:** el token solo da acceso a los datos de su propio `negocioId`.
- **Cubierto por test:** `test/auth.e2e-spec.ts` tiene un `test.failing` ("T4: endpoint de negocio...") que hoy confirma el 200. Al arreglar T4, ese test empieza a fallar: quitar el `.failing`.
- **Dirección posible (a decidir con Juan, no aprobada):** consultar `activo` del usuario (y en su momento el estado del negocio) en `validate()`, con el costo de una consulta por petición; o tokens más cortos con refresh. Ver también "Rotación de JWT_SECRET / revocación de tokens" en Diferido.

### Defensa en profundidad — `actualizar()` usa `update({ where: { id } })`
**Estado: ABIERTO, riesgo bajo hoy**, encontrado el 2026-09-16. **Sin arreglar.**

- En Cliente, Producto, Categoría y Proveedor, `actualizar()` valida la pertenencia con `buscarUno(negocioId, id)` y después hace `update({ where: { id }, data: dto })`. Deuda hace lo mismo en `registrarAbono` (con `data` armado en el service, sin `dto`).
- **Hoy es seguro:** `negocioId` no está en ningún DTO, y el `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted`, en `src/configurar-app.ts`) rechaza con 400 un body que lo incluya. Verificado por `test/aislamiento.e2e-spec.ts` ("B envía el negocioId de A en el body").
- **El riesgo:** es la única barrera. Si algún día se afloja la configuración del pipe o un DTO declara `negocioId`, un `PATCH` podría mover un registro a otro negocio. Los tests e2e lo detectarían.
- **Dirección posible:** `updateMany({ where: { id, negocioId }, data })` o armar `data` sin campos de tenant. A evaluar como tarea propia.

## Diferido (no v1)
- CSRF: mitigado por `sameSite` + que el frontend no es cross-origin no autenticado; revisar si se agregan integraciones externas.
- Logging/monitoreo de intentos de login fallidos (más allá del rate limit).
- Rotación de `JWT_SECRET` / revocación de tokens (no hay blacklist — logout solo borra la cookie, el JWT sigue siendo válido hasta expirar).
- **Condición de carrera en `venta.service.ts::crear()` (encontrado 2026-09-09):** el chequeo de stock disponible (`producto.inventario?.stockActual`) se lee antes de abrir la transacción; el descuento de stock (`decrement`) ocurre dentro de ella. Dos ventas concurrentes del mismo producto podrían leer el mismo stock "viejo", pasar ambas el chequeo, y terminar sobrevendiendo. Riesgo bajo hoy (una sola tienda, poca concurrencia real), pero es una debilidad real de diseño a resolver antes de escalar a más negocios/tráfico simultáneo — por ejemplo moviendo el chequeo dentro de la transacción con un `update` condicional (`WHERE stockActual >= cantidad`) que falle si no alcanza.
