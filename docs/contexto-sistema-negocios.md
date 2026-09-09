# Contexto: Sistema de Gestión para Tiendas y Negocios (Fast Inventory)

## Propósito del proyecto
Sistema de gestión para pequeños comercios (caso piloto: tienda de barrio que vende comida y artículos de papelería). Diseñado desde el inicio para eventualmente escalar a un producto multi-negocio/multi-ciudad.

## Stack tecnológico
- **Backend:** NestJS + Prisma 6.19.3 + PostgreSQL
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (preset Base UI) — completo y funcionando (login, registro, dashboard, 5 módulos CRUD)
- **BaaS/otros:** Supabase — evaluado como opción de DB en la nube, solo relevante cuando se retome el deploy
- **Nota de aprendizaje:** NestJS se eligió intencionalmente porque era una tecnología nueva en la hoja de ruta del desarrollador, y suma diversidad al portafolio.

## Modelo de datos (ERD finalizado)

Tablas implementadas:
- `NEGOCIO`
- `PRODUCTO`
- `CATEGORIA`
- `CLIENTE`
- `PROVEEDOR`
- `VENTA`
- `DETALLE_VENTA`
- `DEUDA`

### Decisiones de diseño clave (ya cerradas, no reabrir sin justificación)
1. **Multi-producto por venta:** una venta puede incluir múltiples productos (relación vía `DETALLE_VENTA`).
2. **Historial de precios implícito:** no hay una tabla separada de historial de precios; se maneja de forma implícita (ej. guardando el precio unitario en `DETALLE_VENTA` al momento de la venta).
3. **Unidad de medida fija por producto:** cada producto tiene una única unidad de medida. Los productos que se venden por peso se estandarizan a **gramos** como unidad base, para evitar ambigüedad entre kg/g.
4. **Cantidad decimal:** `DETALLE_VENTA.cantidad` es de tipo decimal, para soportar cantidades fraccionarias (ej. 0.5 kg → 500 g, o medidas parciales).
5. **Multi-tenancy desde el día uno:** el campo `negocioId` está presente en las tablas core desde el inicio, no se piensa agregar después. Esto es clave para la escalabilidad futura (múltiples negocios usando el mismo sistema).

### Diferido a segunda iteración (NO implementar en v1)
- `COMPRA`
- `CAJA`

`PROVEEDOR` salió de esta lista: terminó implementándose en v1 porque era necesario para completar el flujo real de `PRODUCTO`.

Razón de lo que sigue diferido: mantener el alcance de v1 acotado y enfocado en el flujo esencial (productos, ventas, clientes, deudas).

## Estado actual (resumen)

- **Backend:** completo y probado — 7 módulos (Auth, Categoria, Cliente, Proveedor, Producto, Venta, Deuda), multi-tenancy real (`negocioId` siempre desde el JWT, verificado sin fugas en los 7 servicios), roles `ADMIN`/`VENDEDOR` con matriz de autorización verificada en código, manejo de errores traducido al español.
- **Frontend:** completo y probado — landing animada, login/registro, dashboard con los 5 módulos CRUD funcionando. `/dashboard` muestra el Resumen real con KPIs (FI-001, cerrado y commiteado desde inicios de septiembre).
- **Endurecimiento de seguridad — CERRADO (T0-T3), verificado el 2026-09-09:** rate limiting (T1), matriz de roles, multi-tenancy, autenticación (bcrypt/JWT/cookies), `helmet` (T2) y `.env.example` (T3) confirmados cerrados y correctos, sin ítems pendientes. Backlog completo documentado en `backend/SECURITY-BACKLOG.md` (vive en el repo, no solo en el chat, para que sobreviva entre sesiones).
- **Paginación:** CERRADA en los 5 módulos (backend y frontend) — Cliente, Proveedor, Producto, Venta, Deuda.

El detalle técnico día a día vive en `CONTEXTO-ACTUAL.md` y `PROGRESO-fast-inventory.md` — esos son la fuente viva del estado del proyecto. Este documento es la base conceptual (propósito, modelo de datos, decisiones cerradas) y no se actualiza tarea por tarea.

## Próximos pasos (orden acordado)
1. Decidir el nombre nuevo del producto (pendiente, ver `CONTEXTO-ACTUAL.md`).
2. Mientras tanto, Juan sigue usando y mejorando el sistema en local — no hay más módulos base pendientes (paginación ya cerrada).
3. PWA para instalar en móvil/PC.

**Deploy funcional (Vercel + Railway) — pospuesto explícitamente por decisión de Juan**, no por un bloqueo técnico: prefiere seguir afianzando la base y estructura en local antes de volver a intentarlo. El deploy previo quedó pausado por un bug de login en producción; ya están commiteados varios fixes (sameSite cross-domain, origin de CORS, bind a 0.0.0.0 para Railway) que probablemente lo resuelven, pero no se han probado en vivo. Se retoma cuando Juan lo considere.

## Herramientas y flujo de trabajo
- **Claude (chat/Cowork):** mentor técnico — análisis, planeación, documentación, decisiones de arquitectura. Tiene acceso directo de lectura/escritura al repo local (carpeta conectada) para mantener `docs/` y `CLAUDE.md` sincronizados con este Proyecto.
- **Claude Code en VS Code:** implementación directa del código, edita el repo local. Cualquier backlog o plan de tareas que genere debe quedar guardado en un archivo del repo, no solo en el historial de la sesión.
- **VS Code:** editor.
- **ChatGPT:** supervisor técnico adicional para segunda opinión de arquitectura, cuando se necesite.
- Ya no se usa Cursor — Claude Code es el único agente de implementación.
- **Lección aprendida:** antes de documentar algo como "pendiente" o "sin commitear", verificar con `git log`/`git status` — más de una vez se documentó como pendiente algo que ya estaba commiteado.

## Principios y estándares a mantener
- **Multi-tenant desde el diseño**, no como parche posterior.
- **Estandarización de unidades** (gramos como base) para evitar ambigüedades.
- **Alcance de v1 intencionalmente narrow**: sin compras/caja hasta v2.
- Metodología general del desarrollador: aprende construyendo, prefiere que le señalen errores y malas prácticas en vez de recibir código completo de inmediato (actuar como Senior Engineer/Code Reviewer exigente).

---
*Documento base de propósito y decisiones del proyecto — para continuar el trabajo sin perder el contexto de fondo. Para el estado técnico día a día y la tarea activa, ver `CONTEXTO-ACTUAL.md` y `PROGRESO-fast-inventory.md`.*
