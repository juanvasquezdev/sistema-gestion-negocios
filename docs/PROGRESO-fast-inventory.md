# Fast Inventory — Estado del proyecto (actualizado)

## Info general
- **Repo:** github.com/juanjosevasquez1313-ai/sistema-gestion-negocios
- **Ruta local:** C:\Workspace\projects\sistema-gestion-negocios (monorepo: backend/, frontend/)
- **Stack:** NestJS + Prisma v6.19.3 + PostgreSQL (Docker) | Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (preset **Base UI**, no Radix)
- **Usuario de prueba:** juan@test.com / password123 — ADMIN, negocio "Tienda Don Juan"
- **Metodología:** un archivo a la vez, confirmación antes de avanzar, explicación de cada pieza de código, commits disciplinados.

## Backend — completo y probado
7 módulos: Auth, Categoria, Cliente, Proveedor, Producto, Venta, Deuda.
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
- **Paginación CERRADA en los 5 módulos:** `backend/src/common/dto/paginacion.dto.ts` (pagina/limite con defaults 1/20). Los 5 `service.ts`/`controller.ts` (Cliente, Proveedor, Producto, Venta, Deuda) devuelven `{ data, total, pagina, totalPaginas }`.
- **Endurecimiento de seguridad — CERRADO (T0-T3):** rate limiting con `@nestjs/throttler` en `login` y `registrarNegocio` (5 intentos/minuto por IP, `trust proxy` en `main.ts`), 429 con mensaje en español vía `ThrottlerExceptionFilter`, `helmet` y `.env.example` implementados. Detalle en `backend/SECURITY-BACKLOG.md`.

## Frontend — completo y probado
- Portada animada (`/`): secuencia VELOCIDAD → SEGURIDAD → FACILIDAD (transición tipo cortina, fondo alterna blanco/negro) → se asienta en "Fast Inventory" (tipografía **Space Grotesk**, variable CSS `--font-display`) → botón Siguiente → tarjeta Iniciar sesión/Crear cuenta, o bienvenida directa si ya hay sesión.
- Paleta final: **blanco y negro puro** (`#FAFAFA` / `#0A0A0A`), sin colores de acento (se probaron y descartaron: café, dorado, azul marino — el dueño quería algo minimalista, no "de tienda de barrio").
- Componentes shadcn de este preset usan prop **`render`**, NO `asChild` (ojo con esto en cualquier código nuevo con Button/SidebarMenuButton).
- Login (`/login`) y Registro (`/registrar`) con mismo estilo. Registro ya setea cookie automáticamente tras crear negocio (se corrigió el controller para que también loguee).
- Dashboard protegido (`/dashboard/*`): layout Server Component que verifica sesión vía `GET /auth/perfil` antes de renderizar, si no hay sesión hace `redirect('/login')`.
- Sidebar con navegación a los 5 módulos + botón logout (`DashboardShell` component).
- **Los 5 módulos tienen CRUD completo funcionando:** Clientes, Proveedores, Productos (con selección/creación inline de Categoría y Proveedor), Ventas (carrito multi-producto con cálculo de total en vivo), Deudas (listado + registrar abonos).
- Patrón repetido en cada módulo: `lib/[modulo].ts` (funciones API) + `app/dashboard/[modulo]/page.tsx` (tabla + Dialog crear/editar + AlertDialog eliminar).
- **FI-001 CERRADO:** `/dashboard` muestra el Resumen real, `/dashboard/resumen` redirige. Commiteado desde inicios de septiembre (ver `CONTEXTO-ACTUAL.md`).

## Paginación — CERRADA en los 5 módulos (frontend y backend)
Cada módulo sigue el mismo patrón, usado primero en **Clientes** y replicado en Proveedores, Productos, Ventas y Deudas:
1. `lib/[modulo].ts`: `listar[Modulo](pagina, limite)` devuelve `RespuestaPaginada<T>` (interfaz `{ data, total, pagina, totalPaginas }`), llama a `/[modulo]?pagina=X&limite=Y`.
2. Componente reutilizable `frontend/src/components/paginacion.tsx` (botones Anterior/Siguiente + números de página, estilo shadcn Button).
3. `dashboard/[modulo]/page.tsx`: estado `pagina`/`totalPaginas`, `useEffect` depende de `pagina`, `<Paginacion .../>` después de la tabla.

**2026-09-09:** se consolidó `RespuestaPaginada<T>` (estaba duplicada en `lib/clientes.ts` y `lib/proveedores.ts`) en un archivo neutral, `frontend/src/lib/paginacion.ts`, del que ahora importan los 5 módulos. Sin cambio de comportamiento, verificado en vivo.

**Orden de prioridad actual:** 1) decidir el nombre nuevo, 2) mientras tanto, seguir mejorando y usando el sistema en local, 3) cuando la base esté sólida, retomar deploy. PWA queda para después. Backlog de seguridad, FI-001 y paginación ya cerrados — ver `CONTEXTO-ACTUAL.md` y `contexto-sistema-negocios.md`.

## Plan general pendiente (en orden acordado)
1. ~~Página /registrar~~ ✅
2. ~~Control de roles~~ ✅
3. ~~Mensajes de error amigables~~ ✅
4. ~~Dashboard "Resumen" con indicadores reales (FI-001)~~ ✅
5. ~~Backlog de seguridad (T0-T3)~~ ✅
6. ~~Paginación en los 5 módulos~~ ✅
7. Decidir el nombre nuevo (pendiente de decisión de Juan, ver `CONTEXTO-ACTUAL.md`).
8. Seguir usando y mejorando el sistema en local — decisión explícita de Juan antes de retomar deploy.
9. **Deploy — pospuesto explícitamente** hasta que Juan considere la base y estructura lo suficientemente sólidas (Vercel ya conectado pero con build fallido histórico por asChild — ya corregido en código, falta reintentar deploy; backend necesita hosting tipo Railway/Render + DB en la nube tipo Supabase/Neon; hay que actualizar el `origin` de CORS en `main.ts` al dominio real).
10. PWA para instalar en móvil/PC (recomendado sobre apps nativas separadas — reutiliza el mismo código).

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
