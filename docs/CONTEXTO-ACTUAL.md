# CONTEXTO ACTUAL — FAST INVENTORY

## Prioridad ahora mismo

1. Cerrar el resto del backlog de seguridad: T2 (helmet) y T3 (`.env.example`) — bajo esfuerzo, ver `backend/SECURITY-BACKLOG.md`.
2. Terminar paginación (faltan 4 módulos en frontend, 4 en backend).
3. Deploy: **pospuesto**, no se retoma hasta cerrar 1 y 2.

FI-001 y T1 (rate limiting) están **cerrados y verificados en código** — ver abajo.

## Proyecto

Fast Inventory es un SaaS multi-tenant de gestión de negocios.

Monorepo:

- `backend/` → NestJS + Prisma 6.19.3 + PostgreSQL
- `frontend/` → Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui Base UI

## Reglas críticas

- El aislamiento multi-tenant utiliza `negocioId`.
- El `negocioId` debe provenir del JWT del usuario autenticado.
- Nunca confiar en un `negocioId` enviado por el cliente.
- Roles actuales: `ADMIN` y `VENDEDOR`.
- Prisma debe permanecer en versión 6.19.3 salvo aprobación explícita.
- El proyecto utiliza shadcn/ui con Base UI.
- Usar `render`, no asumir APIs de Radix como `asChild`.
- No cambiar arquitectura, esquema Prisma o dependencias sin aprobación.
- No hacer migraciones/reset de Prisma sin autorización.
- Cambios mínimos y coherentes.
- No afirmar que algo funciona si no fue verificado.

## Flujo de trabajo

Juan es el dueño del producto y toma las decisiones.

Claude Code (en VS Code) es el agente de implementación — inspecciona y edita el código directamente. Ya no se usa Cursor.

Claude (chat/Cowork) funciona como mentor técnico: análisis, planeación y documentación fuera del código. Mantiene los documentos de `docs/` sincronizados con el Proyecto de Claude, y tiene acceso directo de lectura/escritura al repo local vía conexión de carpeta.

ChatGPT actúa como supervisor técnico/arquitectónico cuando esté disponible.

Flujo:

PLAN
→ INSPECCIÓN
→ APROBACIÓN
→ IMPLEMENTACIÓN
→ TEST
→ REVIEW
→ COMMIT
→ DOCUMENTACIÓN si existe conocimiento durable

Una tarea debe ser pequeña y tener un objetivo concreto.

No hacer refactors no relacionados.

No modificar archivos fuera del alcance aprobado.

**Regla:** cualquier backlog o lista de tareas de varios pasos (como una auditoría con T1, T2, T3...) debe quedar escrito en un archivo dentro del repo antes de darla por generada — actualmente en `backend/SECURITY-BACKLOG.md`. Una lista que solo existe en el historial de una sesión de Claude Code se pierde al cerrarla — ya pasó una vez.

**Regla:** antes de dar algo por pendiente o sin commitear, correr `git log --oneline` y `git status` — ya pasó más de una vez que se documentó como pendiente algo que ya estaba commiteado.

## Backlog de seguridad (auditoría) — detalle en `backend/SECURITY-BACKLOG.md`

**Cerrado y verificado en código (2026-09-09):**
- T1 — Rate limiting en login/registro (`@nestjs/throttler`, 5/min por IP, filtro global con mensaje 429 en español, `trust proxy` configurado).
- Matriz de roles/autorización en los 7 módulos — verificada consistente con lo documentado.
- Multi-tenancy (`negocioId`) — verificado sin fugas en los 7 servicios.
- Auth: bcrypt (12 rounds), JWT con secret desde `.env` sin fallback, cookie httpOnly+secure+sameSite correcto, `.env` no commiteado.

**Pendiente:**
- T2 — instalar `helmet` (headers de seguridad HTTP, no está instalado hoy).
- T3 — crear `.env.example` (higiene de onboarding, no es un riesgo real).

## Estado del Dashboard (FI-001 — CERRADO)

`/dashboard` muestra el Resumen real directamente (KPIs, gráfico de 7 días, deudas, stock bajo). `/dashboard/resumen` redirige a `/dashboard`. La landing pública sigue en `/`, sin tocar. Commiteado desde el 1-4 de septiembre (`c0e848b` y relacionados) — un intento de regresión posterior en el working tree fue detectado y descartado con `git checkout HEAD`, no llegó a commitearse.

## Próximo paso

1. Implementar T2 (helmet) y T3 (`.env.example`) — cambios pequeños y de bajo riesgo.
2. Seguir con paginación (backend: Proveedor, Producto, Venta, Deuda; frontend: mismo patrón que Clientes).
3. Solo después, retomar deploy.

## Nota para Claude Code

Este archivo es contexto de continuidad, no reemplaza las reglas del repositorio.

Antes de modificar código:

- inspeccionar los archivos reales;
- respetar `AGENTS.md` si existe;
- no inventar APIs;
- mantener multi-tenancy;
- hacer cambios mínimos.

Si existe una decisión arquitectónica no cubierta aquí, detenerse y pedir confirmación.
