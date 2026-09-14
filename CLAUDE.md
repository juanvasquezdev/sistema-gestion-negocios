# Fast Inventory (nombre en proceso de cambio) — Contexto para Claude Code

Este archivo se carga automáticamente en cada sesión de Claude Code dentro de este repo.
No lo dupliques a mano en el prompt — Claude Code ya lo lee solo al abrir el proyecto.

> **Nombre en transición:** "Fast Inventory" se va a reemplazar porque ya existe como marca/producto de terceros. Nombre provisional elegido: **Nudo** (14 sept 2026) — se descartaron Bodegix/Tiendix/Kiosca/Bodeka (genéricos) y también "Auge" (ya lo usa un competidor directo: app "Auge - Inventario y ventas" en LatAm). Falta verificar dominio disponible y registro de marca en la SIC (Colombia) antes de aplicarlo — no renombrar nada en el repo todavía sin confirmación explícita.

> **Nota (14 sept 2026, Claude/Cowork):** este archivo tenía la paginación marcada como "en proceso"/"faltan 4 módulos", pero `docs/CONTEXTO-ACTUAL.md` y `docs/PROGRESO-fast-inventory.md` ya la habían corregido a CERRADA desde el 9 sept (no se había sincronizado a este archivo). Corregido abajo — verificado de nuevo leyendo el código real.

## Documentos de contexto

Estos documentos se sincronizan desde el Proyecto de Claude "Sistema de Negocios" (Cowork) — ábrelos si necesitas el porqué detrás de una decisión o el historial detallado, no solo las reglas de abajo:

- @docs/contexto-sistema-negocios.md — propósito, modelo de datos y decisiones de diseño cerradas
- @docs/CONTEXTO-ACTUAL.md — estado técnico día a día, prioridad actual y lint pendiente
- @docs/PROGRESO-fast-inventory.md — historial detallado de qué se construyó y notas técnicas
- `backend/SECURITY-BACKLOG.md` — auditoría de seguridad (T0-T3, CERRADA), fuente de verdad para ese tema
- `docs/design-system.md` — tokens visuales, qué es Magic UI vs shadcn/Base UI, y patrones ya existentes que no hay que reinventar

## Agentes especializados (subagentes de Claude Code)

Este repo define 4 subagentes en `.claude/agents/` (Claude Code los detecta solo, no hay que "instalarlos" con ningún comando):

- **`code-reviewer`** — revisión de seguridad/multi-tenancy/correctitud antes de dar algo por cerrado.
- **`architect`** — decisiones de arquitectura, evaluar si de verdad hace falta algo nuevo antes de agregarlo.
- **`ui-ux-designer`** — trabajo visual: aplica Magic UI + Framer Motion siguiendo `docs/design-system.md`, respeta el preset Base UI.
- **`seo-optimizer`** — SEO de las páginas públicas (`/`, `/login`, `/registrar`); no toca el dashboard autenticado.

Invocarlos es usar el mecanismo de subagentes de Claude Code con ese nombre quien corresponda según la tarea, no correr un comando de instalación aparte.

## Decisiones de librerías aprobadas — visual y PWA (14 sept 2026)

Juan aprobó explícitamente estas dos, no hace falta volver a preguntar:

- **PWA:** Serwist vía **`@serwist/turbopack`** (+ `serwist` + `esbuild`, devDependencies) — gratis, MIT, mantenido activamente para Next App Router. Se prefirió sobre `next-pwa` (mantenimiento más lento) y sobre escribirlo a mano. **No usar `@serwist/next`**: es un plugin de webpack y Next 16 construye con Turbopack por defecto (obligaría a `next build --webpack`). Decisión de Juan, 14 sept 2026.
- **Visual/UI:** `Magic UI` (magicui.design) — componentes gratis y open source (MIT) que se copian al repo, hechos con Tailwind + Motion. Se prefirió sobre Aceternity UI (su capa gratis es más chica; lo bueno está en un plan de pago que no se necesita acá). Uso: SOLO para efectos decorativos/animación, nunca para reemplazar un componente shadcn/Base UI que ya funciona — ver `docs/design-system.md`.

No introducir ninguna otra librería de UI/PWA sin que Juan lo apruebe de nuevo.

## Rol de Claude en este proyecto

Actúa como mentor técnico senior + code reviewer exigente, no como generador de código automático.

- Yo (Juan) tomo las decisiones de producto, arquitectura y alcance.
- Antes de una implementación importante: mostrar objetivo, archivos afectados, solución propuesta y riesgos — y esperar mi aprobación.
- No asumir decisiones importantes sin consultarme.
- No hacer refactors masivos para resolver problemas pequeños.
- No modificar archivos fuera del alcance aprobado.
- No afirmar que algo funciona si no fue verificado (correr el comando / mostrar el resultado).
- Cambios mínimos y coherentes con lo que ya existe.

## Proyecto

SaaS multi-tenant de gestión para pequeños comercios (caso piloto: tienda de barrio). Nombre comercial en proceso de cambio (ver arriba).
Diseñado desde el día uno para escalar a multi-negocio / multi-ciudad.

Monorepo:
- `backend/` → NestJS + Prisma 6.19.3 + PostgreSQL
- `frontend/` → Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (preset **Base UI**, no Radix)

Repo: github.com/juanjosevasquez1313-ai/sistema-gestion-negocios
Ruta local: `C:\Workspace\projects\sistema-gestion-negocios`
Usuario de prueba: `juan@test.com` / `password123` — ADMIN, negocio "Tienda Don Juan"

## Reglas críticas (no negociables sin aprobación explícita)

- **Multi-tenancy real**: aislamiento por `negocioId`. El `negocioId` SIEMPRE sale del JWT del usuario autenticado — nunca confiar en uno enviado por el cliente. Toda consulta a datos de negocio usa `findFirst({ id, negocioId })`. Verificado en los 7 servicios, sin fugas (ver `backend/SECURITY-BACKLOG.md`).
- **Roles**: `ADMIN` y `VENDEDOR`, siempre en mayúsculas (el JWT los guarda así — ya hubo un bug por usar `'admin'` en minúscula en `@Roles()`, corregido).
- **Prisma se mantiene en 6.19.3** salvo decisión explícita mía. No proponer cambios de schema o migraciones sin analizar primero el impacto.
- **shadcn/ui usa Base UI**, no Radix: usar el patrón `render`, nunca asumir `asChild`.
- No crear un endpoint nuevo si uno existente puede resolver la necesidad.
- No introducir librerías o tecnologías nuevas sin necesidad real.
- Seguridad: nunca recomendar desactivar auth, saltar autorización, quitar validaciones, exponer datos de otro negocio, o soluciones temporales que comprometan seguridad.

## Metodología de trabajo

```
PLAN → INSPECCIÓN → APROBACIÓN → IMPLEMENTACIÓN → TEST → REVIEW → COMMIT → DOCUMENTACIÓN (si hay conocimiento durable)
```

- Cada tarea debe ser pequeña y con un objetivo concreto.
- Antes de tocar código: inspeccionar los archivos reales del repo (no asumir su contenido), respetar `AGENTS.md` si existe.
- No inventar APIs, componentes o estructuras sin verificarlas primero en el código.
- Si hay una decisión arquitectónica no cubierta en este documento: detenerse y preguntar, no improvisar.
- Cualquier backlog o lista de tareas de varios pasos (como una auditoría de seguridad con T1, T2, T3...) debe quedar escrito en un archivo del repo (ej. `backend/SECURITY-BACKLOG.md`) antes de darla por generada. Mantenerlo actualizado cuando se cierre un ítem.
- **`npm run lint` en `backend/` incluye `--fix`** — reescribe archivos, no es de solo lectura. Revisar el diff antes de commitear cualquier cosa después de correrlo.

## Estado actual del sistema

### Backend — completo y probado
7 módulos: Auth, Categoria, Cliente, Proveedor, Producto, Venta, Deuda.

- Transacciones atómicas: Producto+Inventario juntos; Venta+DetalleVenta+Deuda (si queda pendiente)+descuento de stock.
- Regla de negocio: `precioVenta` es por KILOGRAMO si `unidadMedida = GRAMO`, por unidad si `UNIDAD` (la cantidad de venta viaja en gramos, se divide /1000 para el cálculo).
- Auth: JWT vía cookie httpOnly + soporte Bearer paralelo. CORS restringido a `localhost:3001` + dominio de Vercel, `credentials: true`. `helmet` activo (headers de seguridad HTTP).
- RolesGuard + `@Roles()` implementado con esta matriz (verificada en código):
  - Cliente: crear/listar/ver = cualquiera; editar/eliminar = solo ADMIN.
  - Producto: listar/ver = cualquiera; crear/editar/eliminar = solo ADMIN.
  - Proveedor, Categoria: todo el módulo solo ADMIN.
  - Venta, Deuda: ADMIN y VENDEDOR (explícito).
- `PrismaExceptionFilter` global traduce P2002/P2003/P2025 a mensajes en español.
- **Backlog de seguridad (T0-T3) — CERRADO.** Rate limiting, matriz de roles, multi-tenancy, auth, helmet y `.env.example` verificados. Detalle en `backend/SECURITY-BACKLOG.md`.
- **Lint:** relevante ya corregido (commit `59f5ce4`); queda solo Prettier/estilo preexistente y 2 items menores sin tocar a propósito, ver `docs/CONTEXTO-ACTUAL.md`.
- **Paginación — CERRADA en los 5 módulos** (Cliente, Proveedor, Producto, Venta, Deuda): `backend/src/common/dto/paginacion.dto.ts` (pagina/limite, defaults 1/20), `listar()` devuelve `{ data, total, pagina, totalPaginas }` en los 5 services, controller recibe `@Query() paginacion: PaginacionDto`. Verificado en código el 14 sept 2026, ver `docs/CONTEXTO-ACTUAL.md`.

### Frontend — completo y probado
- Landing animada en `/` (secuencia VELOCIDAD → SEGURIDAD → FACILIDAD, tipografía Space Grotesk, paleta blanco/negro puro `#FAFAFA`/`#0A0A0A`, sin color de acento).
- Login (`/login`) y Registro (`/registrar`); registro ya loguea automáticamente tras crear el negocio.
- Dashboard protegido (`frontend/src/app/dashboard/layout.tsx`, Server Component, verifica `GET /auth/perfil`, redirige a `/login` si no hay sesión).
- `/dashboard` muestra el Resumen real directamente (FI-001, cerrado). `/dashboard/resumen` redirige a `/dashboard`.
- Sidebar (`DashboardShell`) con navegación a los 5 módulos + logout.
- 5 módulos con CRUD completo: Clientes, Proveedores, Productos (con selección/creación inline de Categoría y Proveedor), Ventas (carrito multi-producto, total en vivo), Deudas (listado + registrar abonos).
- Patrón por módulo: `lib/[modulo].ts` (funciones API) + `app/dashboard/[modulo]/page.tsx` (tabla + Dialog crear/editar + AlertDialog eliminar).
- **Lint:** relevante ya corregido (commit `59f5ce4`), ver `docs/CONTEXTO-ACTUAL.md`.
- **Paginación — CERRADA en los 5 módulos**: `lib/[modulo].ts` tipado con `RespuestaPaginada<T>` (consolidada en `frontend/src/lib/paginacion.ts`), componente reutilizable `components/paginacion.tsx`, estado `pagina`/`totalPaginas` + `<Paginacion />` en cada `dashboard/[modulo]/page.tsx`. Verificado en código el 14 sept 2026, ver `docs/CONTEXTO-ACTUAL.md`.

## Próximos pasos (orden acordado)

1. ~~Página /registrar~~ ✅
2. ~~Control de roles~~ ✅
3. ~~Mensajes de error amigables~~ ✅
4. ~~Backlog de seguridad (T0-T3)~~ ✅
5. ~~Dashboard "Resumen" (FI-001)~~ ✅
6. ~~Lint pendiente~~ ✅
7. ~~Paginación en los 5 módulos~~ ✅ — verificado en código, ver `docs/CONTEXTO-ACTUAL.md` (commits `6012090`, `27673e5`).
8. **Decidir y aplicar el nombre nuevo** (ver nota arriba) — pendiente de decisión de Juan.
9. Seguir usando y mejorando el sistema en local — decisión explícita de Juan, no un bloqueo técnico.
10. PWA para instalar en móvil/PC.

**Deploy (Vercel + Railway): pospuesto explícitamente** — decisión de Juan, ya no por bloqueo técnico (la paginación, que era el punto pendiente, ya está cerrada). Se retoma cuando Juan considere la base y estructura lo suficientemente sólidas. Nota: ya están commiteados varios fixes que probablemente resuelven el bug de login en producción reportado antes (`ef9fb4c` sameSite=none cross-domain, `bcbeac2` origin CORS de Vercel, `1da353c` bind 0.0.0.0 para Railway) — sin verificar en vivo porque el deploy sigue fuera de alcance por ahora.

Después de esta lista técnica: retoques visuales/animaciones más pulidos (pospuesto a propósito).

## Notas para no repetir errores ya resueltos

- Nombres de archivo SIEMPRE con punto (`cliente.service.ts`), nunca con guion.
- Al pegar un archivo completo: `Ctrl+A` + Delete antes de pegar, nunca pegar encima de contenido viejo (causa imports duplicados) — esto causó una regresión real en `dashboard/resumen/page.tsx` que hubo que descartar con `git checkout HEAD`.
- Los campos reales del JWT decodificado son `usuario.negocioId` y `usuario.userId` (interfaz `UsuarioAutenticado` en `backend/src/auth/usuario-actual.decorator.ts`), no `id`.
- El backend debe encenderse ANTES que el frontend (si no, Next.js toma el puerto 3000 y el backend falla con `EADDRINUSE`).
- Docker debe estar arriba (`docker compose up -d`) antes de `npm run start:dev` del backend, si no falla con `PrismaClientInitializationError`.
- Usar `.gitattributes` (ya existe) para forzar LF — evita diffs falsos masivos por CRLF de Windows (ya pasó una vez, ~93 archivos, se corrigió en `5d2eb0e`).
- Antes de asumir que algo está "pendiente" o "sin commitear": correr `git log --oneline` y `git status` — varias veces se documentó como pendiente algo que ya estaba commiteado.
- `npm run lint` en `backend/` trae `--fix` — reescribe archivos aunque solo quieras revisar el estado (pasó dos veces, ~43 errores de Prettier preexistentes se auto-formatean). Revisar el diff y revertir si no era la intención, antes de commitear cualquier otra cosa.
