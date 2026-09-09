# Fast Inventory — Estado del proyecto (actualizado)

## Info general
- **Repo:** github.com/juanjosevasquez1313-ai/sistema-gestion-negocios
- **Ruta local:** C:\Workspace\projects\sistema-gestion-negocios (monorepo: backend/, frontend/)
- **Stack:** NestJS + Prisma v6.19.3 + PostgreSQL (Docker) | Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (preset **Base UI**, no Radix)
- **Usuario de prueba:** juan@test.com / password123 — ADMIN, negocio "Tienda Don Juan"
- **Metodología:** un archivo a la vez, confirmación antes de avanzar, explicación de cada pieza de código, commits disciplinados.

## Backend — completo y probado
6 módulos: Auth, Categoria, Cliente, Proveedor, Producto, Venta, Deuda.
- Multi-tenancy real: siempre `findFirst({ id, negocioId })`.
- Transacciones: Producto+Inventario juntos; Venta+DetalleVenta+Deuda(si pendiente)+descuento de stock atómico.
- Regla de negocio: `precioVenta` es por KILOGRAMO si `unidadMedida = GRAMO`, por unidad si `UNIDAD` (cantidad de venta viaja en gramos, se divide /1000 para el cálculo).
- Auth: JWT vía cookie httpOnly (`res.cookie('token', ...)`) + soporte Bearer paralelo. CORS con `credentials: true` para `localhost:3001`.
- **RolesGuard + @Roles() recién implementado.** Matriz:
  - Cliente: crear/listar/ver = cualquiera; editar/eliminar = solo ADMIN
  - Producto: listar/ver = cualquiera; crear/editar/eliminar = solo ADMIN
  - Proveedor, Categoria: TODO el módulo solo ADMIN
  - Venta, Deuda: sin restricción de rol
  - ⚠️ Bug ya corregido: `@Roles('admin')` en minúscula bloqueaba a ADMIN real (JWT usa `'ADMIN'` mayúscula). Revisado y corregido en los 4 controllers afectados.
- **PrismaExceptionFilter global** (`backend/src/common/prisma-exception.filter.ts`, registrado en `main.ts` con `app.useGlobalFilters(...)`): traduce P2002 (duplicado), P2003 (relación bloqueante), P2025 (no encontrado) a mensajes en español.
- **Paginación EN PROCESO:** se creó `backend/src/common/dto/paginacion.dto.ts` (pagina/limite con defaults 1/20). Se modificaron los 5 `service.ts` y `controller.ts` (Cliente, Proveedor, Producto, Venta, Deuda) para que `listar()` devuelva `{ data, total, pagina, totalPaginas }` en vez de array plano.
- **Endurecimiento de seguridad EN CURSO (T1):** rate limiting con `@nestjs/throttler` en `login` y `registrarNegocio` (5 intentos/minuto por IP, `trust proxy` configurado en `main.ts`). Falta que el 429 devuelva mensaje en español (pendiente, ver `CONTEXTO-ACTUAL.md`).

## Frontend — completo y probado
- Portada animada (`/`): secuencia VELOCIDAD → SEGURIDAD → FACILIDAD (transición tipo cortina, fondo alterna blanco/negro) → se asienta en "Fast Inventory" (tipografía **Space Grotesk**, variable CSS `--font-display`) → botón Siguiente → tarjeta Iniciar sesión/Crear cuenta, o bienvenida directa si ya hay sesión.
- Paleta final: **blanco y negro puro** (`#FAFAFA` / `#0A0A0A`), sin colores de acento (se probaron y descartaron: café, dorado, azul marino — el dueño quería algo minimalista, no "de tienda de barrio").
- Componentes shadcn de este preset usan prop **`render`**, NO `asChild` (ojo con esto en cualquier código nuevo con Button/SidebarMenuButton).
- Login (`/login`) y Registro (`/registrar`) con mismo estilo. Registro ya setea cookie automáticamente tras crear negocio (se corrigió el controller para que también loguee).
- Dashboard protegido (`/dashboard/*`): layout Server Component que verifica sesión vía `GET /auth/perfil` antes de renderizar, si no hay sesión hace `redirect('/login')`.
- Sidebar con navegación a los 5 módulos + botón logout (`DashboardShell` component).
- **Los 5 módulos tienen CRUD completo funcionando:** Clientes, Proveedores, Productos (con selección/creación inline de Categoría y Proveedor), Ventas (carrito multi-producto con cálculo de total en vivo), Deudas (listado + registrar abonos).
- Patrón repetido en cada módulo: `lib/[modulo].ts` (funciones API) + `app/dashboard/[modulo]/page.tsx` (tabla + Dialog crear/editar + AlertDialog eliminar).
- **FI-001 EN CURSO:** hay cambios locales sin commitear en `dashboard/resumen/page.tsx` pendientes de validar contra el checklist (ver `CONTEXTO-ACTUAL.md`).

## EN PROCESO AHORA MISMO — paginación del frontend
Se estaba actualizando cada página para consumir la nueva forma paginada del backend. Ya se dio la plantilla completa para **Clientes**:
1. `lib/clientes.ts`: `listarClientes(pagina, limite)` ahora devuelve `RespuestaPaginada<Cliente>` (interfaz `{ data, total, pagina, totalPaginas }`), llama a `/clientes?pagina=X&limite=Y`.
2. Nuevo componente reutilizable `frontend/src/components/paginacion.tsx` (botones Anterior/Siguiente + números de página, estilo shadcn Button).
3. `dashboard/clientes/page.tsx`: agregado estado `pagina`/`totalPaginas`, `useEffect` depende de `pagina`, se agregó `<Paginacion .../>` después de la tabla.

**PENDIENTE INMEDIATO:** replicar exactamente el mismo patrón (los mismos 3 tipos de cambio) en:
- `lib/proveedores.ts` + `dashboard/proveedores/page.tsx`
- `lib/productos.ts` + `dashboard/productos/page.tsx`
- `lib/ventas.ts` + `dashboard/ventas/page.tsx`
- `lib/deudas.ts` + `dashboard/deudas/page.tsx`

Último resultado confirmado: Clientes cargó bien tras el cambio (pendiente de que el usuario confirme captura final).

**Orden de prioridad actual (actualizado):** 1) cerrar backlog de seguridad, 2) terminar esta paginación, 3) FI-001, 4) PWA. Deploy pospuesto — ver `CONTEXTO-ACTUAL.md` y `contexto-sistema-negocios.md`.

## Plan general pendiente (en orden acordado)
1. ~~Página /registrar~~ ✅
2. ~~Control de roles~~ ✅
3. ~~Mensajes de error amigables~~ ✅
4. **Paginación — EN PROCESO (falta replicar en 4 módulos restantes)**
5. Dashboard "Resumen" con indicadores reales (FI-001, en curso)
6. **Deploy — pospuesto explícitamente**, no se retoma hasta cerrar los puntos anteriores (Vercel ya conectado pero con build fallido histórico por asChild — ya corregido en código, falta reintentar deploy; backend necesita hosting tipo Railway/Render + DB en la nube tipo Supabase/Neon; hay que actualizar el `origin` de CORS en `main.ts` al dominio real)
7. PWA para instalar en móvil/PC (recomendado sobre apps nativas separadas — reutiliza el mismo código)

## Después de terminar la lista técnica
- El usuario quiere retomar retoques visuales/animaciones en cada interfaz (más pulido, no solo funcional) — se pospuso a propósito hasta cerrar la lista técnica de arriba.
- Estrategia de LinkedIn acordada: NO postear cada día suelto. Postear cuando el deploy esté funcionando (mostrar URL real, no localhost) como "lanzamiento", contando el proceso real (errores incluidos, como el bug de cálculo de $10.5M o el de asChild/render). Ya existe un post del "Día 1" del proyecto — el post de lanzamiento puede conectarse a ese como continuidad narrativa. Los retoques visuales posteriores pueden ser un segundo post tipo "antes/después".

## Notas técnicas para no repetir errores ya resueltos
- Nombres de archivo: SIEMPRE con punto (`cliente.service.ts`), nunca guion — pasó varias veces al inicio.
- Al pegar un archivo completo nuevo: SIEMPRE `Ctrl+A` + Delete antes de pegar, nunca pegar encima de contenido viejo (causó imports duplicados varias veces).
- `usuario.negocioId` y `usuario.userId` son los nombres de campo reales en el JWT decodificado (interfaz `UsuarioAutenticado` en `backend/src/auth/usuario-actual.decorator.ts`), no `id`.
- Backend SIEMPRE se enciende antes que frontend (si no, Next.js toma el puerto 3000 y el backend falla con EADDRINUSE al querer usar el mismo puerto). **Mitigado:** `frontend/package.json` ahora fija `"dev": "next dev -p 3001"`, así el frontend ya no puede caer por accidente en el 3000 sin importar el orden de arranque.
- Docker debe estar levantado (`docker compose up -d`) antes de `npm run start:dev` del backend, si no falla con `PrismaClientInitializationError: Can't reach database server`.
- Claude Code no debe levantar `npm run start:dev`/`npm run dev` en segundo plano de forma casual: Juan corre sus propios servidores, Claude Code solo toma control temporalmente (avisando antes y después) cuando necesita probar un cambio.

---
*Sincronizado desde el Proyecto de Claude "Sistema de Negocios". Este archivo lo mantiene principalmente Claude (Cowork); el estado técnico minuto a minuto vive en `CONTEXTO-ACTUAL.md`.*
