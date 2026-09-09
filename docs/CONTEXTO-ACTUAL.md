# CONTEXTO ACTUAL — FAST INVENTORY (nombre en proceso de cambio, ver abajo)

## Prioridad ahora mismo

1. **Decidir el nombre nuevo** — "Fast Inventory" ya existe como marca/producto de terceros, se descartó. Candidatos preseleccionados (sin choque directo encontrado en búsqueda web, no es una búsqueda formal de marca): **Bodegix, Tiendix, Kiosca, Bodeka**. Antes de adoptarlo: revisar dominio disponible y registro de marcas de la SIC (Colombia). Pendiente de decisión de Juan — no se ha renombrado nada en el repo todavía.
2. Terminar paginación (faltan 4 módulos en frontend, 4 en backend).
3. Deploy: **pospuesto**, no se retoma hasta cerrar el punto 2.

El backlog de seguridad completo (T0-T3), FI-001 y el housekeeping de git están **cerrados**.

## Proyecto

SaaS multi-tenant de gestión de negocios (nombre en proceso de cambio, ver arriba).

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

Claude (chat/Cowork) funciona como mentor técnico: análisis, planeación y documentación fuera del código. Tiene acceso directo de lectura/escritura al repo local (carpeta conectada) para mantener `docs/`, `CLAUDE.md` y el propio git sincronizados con este Proyecto — puede hacer commits de housekeeping (docs, config, limpieza) cuando Juan lo pide explícitamente, pero no implementa features ni toca lógica de negocio: eso es trabajo de Claude Code.

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

**Regla nueva:** `npm run lint` en `backend/` (y puede que en `frontend/`) incluye `--fix` — NO es de solo lectura, reescribe archivos. Antes de correrlo para "solo revisar" el estado, tenerlo en cuenta y revisar el diff resultante antes de commitear cualquier cosa (ya pasó: un chequeo de rutina reformateó 18 archivos sin aprobación; se revirtió con `git checkout` antes de commitear).

## Backlog de seguridad — CERRADO (T0-T3)

Detalle completo en `backend/SECURITY-BACKLOG.md`. Resumen:
- T0 (RolesGuard explícito en Venta/Deuda), T1 (rate limiting), matriz de roles, multi-tenancy y auth (bcrypt/JWT/cookies): verificados en código.
- T2 (helmet) y T3 (`.env.example`): implementados y verificados por Claude Code (helmet probado con `curl` real, headers confirmados; login/CORS siguen funcionando). Commit `3888f73`.

No queda backlog de seguridad pendiente.

## Housekeeping de git — CERRADO

Repo local limpio (`git status` sin cambios pendientes) después de:
- `f998ddb` — eliminar archivos de Cursor (ya no se usa)
- `f6a648e` — sincronizar `docs/` y `CLAUDE.md` con el estado real verificado
- `1172f13` — agregar `backend/.claude/settings.json` y `frontend/AGENTS.md`/`CLAUDE.md` (generados por `next dev`, se commitean para que no aparezcan como cambio sin commitear en cada arranque)

Nota técnica: hubo un `.git/index.lock` trabado que bloqueaba commits — se resolvió pidiendo permiso de borrado en la carpeta conectada. Si vuelve a pasar, mismo procedimiento.

## Lint — CERRADO lo relevante (commit `59f5ce4`)

Claude Code corrigió los `any` sin tipar y los `setState` síncronos en `useEffect` (2 archivos backend, 7 frontend), sin cambiar comportamiento (verificado en vivo: login, acceso ADMIN, bloqueo 401 sin token; `tsc --noEmit` limpio). Detalle completo en el mensaje del commit.

Queda deliberadamente sin tocar (bajo impacto, no bloqueante):
- `backend/src/main.ts` — 1 warning de floating-promise.
- `backend/src/venta/venta.service.ts` — 1 error de tipo en un template literal con `Decimal`.
- ~43 errores de formato (Prettier) preexistentes en el backend — solo estilo, no lógica. **No correr `npm run lint` para "solo mirar" el estado:** cada vez que se corrió en esta sesión, el `--fix` reformateó automáticamente decenas de archivos por estos errores de Prettier. Se revirtió dos veces con `git checkout -- backend/src` antes de commitear nada. Si se quiere corregir el formato, hacerlo como una tarea propia y revisada, no como efecto secundario de revisar el lint.

## Estado del Dashboard (FI-001 — CERRADO)

`/dashboard` muestra el Resumen real directamente (KPIs, gráfico de 7 días, deudas, stock bajo). `/dashboard/resumen` redirige a `/dashboard`. Commiteado desde inicios de septiembre.

## Próximo paso

1. Definir el nombre nuevo (Bodegix / Tiendix / Kiosca / Bodeka u otro) y aplicarlo donde corresponda (repo, docs, UI).
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
