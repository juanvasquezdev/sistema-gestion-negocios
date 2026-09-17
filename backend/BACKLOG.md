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
