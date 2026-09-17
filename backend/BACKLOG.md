# Backlog técnico — backend

Problemas funcionales y de configuración encontrados que **no son de seguridad** (esos van en `SECURITY-BACKLOG.md`) y que todavía no se arreglan. Cada ítem se resuelve como tarea propia, con plan y aprobación de Juan.

## Abierto

### B1 — `DELETE /productos/:id` probablemente responde siempre 409
**Estado: ABIERTO, sin probar.** Encontrado el 2026-09-16 leyendo el código durante la inspección para los tests e2e.

- `ProductoService.crear()` crea el `Producto` y su `Inventario` en la misma transacción, así que todo producto creado por la API tiene inventario.
- `ProductoService.eliminar()` hace `producto.delete({ where: { id } })` sin borrar antes el inventario.
- La FK `inventarios.productoId → productos.id` es `ON DELETE RESTRICT` (migración `20260826223425_init`). Prisma lanzaría P2003, que `PrismaExceptionFilter` traduce a **409** "No se puede completar la acción porque este registro está relacionado con otros datos...".
- **Sin verificar en vivo ni con test:** el test e2e del VENDEDOR no llega ahí porque el 403 va antes. Primer paso: reproducirlo (un ADMIN borra un producto recién creado, sin ventas).
- Decisión de producto pendiente: borrar el inventario junto con el producto (transacción) o reemplazar el borrado por desactivar (`activo = false`), sobre todo si el producto tiene ventas (`detalle_ventas` también es `RESTRICT`).

### B2 — `start:prod` apunta a `dist/main`, pero el build deja `dist/src/main.js`
**Estado: ABIERTO.** Encontrado el 2026-09-16. Importa cuando se retome el deploy (Railway).

- `package.json`: `"start:prod": "node dist/main"`.
- `tsconfig.json` no fija `rootDir` y el build incluye `prisma/seed.ts`, así que TypeScript toma `backend/` como raíz y la salida queda en `dist/src/...` y `dist/prisma/...`. Confirmado en el `dist/` local: existe `dist/src/main.js`, no existe `dist/main.js`.
- `npm run start:prod` fallaría con "Cannot find module". `nest start` (dev) no se ve afectado.
- Opciones a evaluar: apuntar el script a `dist/src/main`, o excluir `prisma/` del build (`tsconfig.build.json`). Verificar con un build limpio antes de cambiar nada.

## Cerrado

### B3 — El frontend no redirigía a `/login` ante un 401 en plena sesión
**Estado: CERRADO**, commit `d2672db` (2026-09-17).

- **Qué pasaba:** `lib/api.ts` no trataba el 401 y el layout del dashboard solo verifica la sesión al recargar (en App Router no se vuelve a ejecutar al navegar). Desde T4, un usuario desactivado se quedaba viendo errores genéricos hasta recargar.
- **Arreglo** (`frontend/src/lib/api.ts` y `frontend/src/app/login/page.tsx`, sin backend ni middleware):
  - Un 401 en el navegador llama a `POST /auth/logout` (borra la cookie httpOnly) y hace `window.location.replace('/login?sesion=expirada')`. Una bandera evita redirecciones repetidas; la promesa queda pendiente para no mostrar un error justo antes de salir.
  - Excluidos: `/auth/login` (credenciales incorrectas), `/auth/registrar-negocio` y `/auth/logout`. Solo el 401 redirige: el 403 sigue mostrando el mensaje de permisos. En el servidor (sin `window`) no cambia nada.
  - La landing no se ve afectada: su verificación de sesión es del servidor con `fetch` directo, no pasa por `api.ts`.
  - El login muestra "Tu sesión expiró o fue cerrada. Vuelve a iniciar sesión." con `?sesion=expirada` (aviso neutro, tokens del design-system); se lee en un efecto, sin `useSearchParams`.
- **Verificado en Chrome real** (backend y build de producción propios en puertos aparte, usuarios de prueba creados y borrados), 28/28 comprobaciones: contraseña incorrecta sin redirección; landing sin sesión con su tarjeta; usuario desactivado navegando a Productos → 3 peticiones 401 a la vez, 1 logout, 1 navegación a `/login?sesion=expirada`, cookie borrada; VENDEDOR con 403 sin redirección; reingreso normal tras reactivar.
