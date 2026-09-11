# Sistema de Gestión para Negocios

SaaS multi-tenant para la administración diaria de pequeños comercios (caso piloto: tienda de barrio que vende comida y artículos de papelería), diseñado desde el inicio para escalar a múltiples negocios y ciudades.

> El nombre del proyecto está en proceso de cambio (candidatos en evaluación: Bodegix, Tiendix, Kiosca, Bodeka). Este README se actualizará cuando se defina.

## Contenido

- [Descripción](#descripción)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Modelo de datos](#modelo-de-datos)
- [Funcionalidades](#funcionalidades)
- [Requisitos previos](#requisitos-previos)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Autenticación y roles](#autenticación-y-roles)
- [Estado del proyecto](#estado-del-proyecto)

## Descripción

Permite gestionar productos, inventario, categorías, proveedores, clientes, ventas (multi-producto por venta) y deudas de un negocio, con aislamiento estricto entre negocios (multi-tenant) desde el diseño de la base de datos.

Decisiones de diseño clave:

- **Multi-producto por venta**, vía la tabla `DetalleVenta`.
- **Historial de precios implícito**: no hay tabla de historial; el precio unitario se guarda en `DetalleVenta` al momento de la venta.
- **Unidad de medida fija por producto**: los productos que se venden por peso se estandarizan a **gramos** como unidad base, para evitar ambigüedad entre kg/g.
- **Cantidad decimal** en `DetalleVenta`, para soportar cantidades fraccionarias (ej. 0.5 kg → 500 g).
- **Multi-tenancy desde el día uno**: todas las tablas core tienen `negocioId`, obtenido siempre del JWT del usuario autenticado — nunca del cliente.

Diferido intencionalmente a una v2 (fuera de alcance de v1): `Compra` y `Caja`.

## Stack tecnológico

**Backend**
- NestJS 11 + TypeScript
- Prisma 6.19.3 + PostgreSQL 16
- Auth: JWT (cookie httpOnly + soporte Bearer), Passport, bcrypt
- Seguridad: Helmet, rate limiting (`@nestjs/throttler`), `class-validator`

**Frontend**
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (preset **Base UI**, no Radix)
- Framer Motion, Recharts

**Infraestructura local**
- Docker (PostgreSQL vía `docker-compose.yml`)

## Estructura del repositorio

Monorepo con dos aplicaciones independientes:

```
.
├── backend/     # API NestJS + Prisma
│   ├── src/
│   │   ├── auth/         # login, registro, JWT, guards de roles
│   │   ├── categoria/
│   │   ├── cliente/
│   │   ├── proveedor/
│   │   ├── producto/
│   │   ├── venta/
│   │   ├── deuda/
│   │   ├── resumen/      # KPIs del dashboard
│   │   └── common/       # filtros, DTOs y utilidades compartidas
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/    # Next.js App Router
│   └── src/
│       ├── app/
│       │   ├── login/
│       │   ├── registrar/
│       │   └── dashboard/    # clientes, proveedores, productos, ventas, deudas
│       ├── components/
│       ├── hooks/
│       └── lib/
└── docker-compose.yml   # PostgreSQL para desarrollo local
```

## Modelo de datos

Entidades principales: `Negocio`, `Usuario`, `Rol`, `Categoria`, `Proveedor`, `Producto`, `Inventario`, `Cliente`, `Venta`, `DetalleVenta`, `Deuda`.

Todas las tablas relevantes del negocio están indexadas por `negocioId`, que es el mecanismo de aislamiento multi-tenant. El esquema completo vive en [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

## Funcionalidades

**Backend** — 7 módulos con CRUD completo y multi-tenancy verificada (`findFirst({ id, negocioId })` en cada consulta):

- **Auth**: registro (crea negocio + usuario ADMIN), login, perfil.
- **Categoría**, **Proveedor**, **Producto** (con inventario asociado), **Cliente**.
- **Venta**: carrito multi-producto, cálculo de total, descuento de stock y generación de deuda (si aplica) en una sola transacción atómica. El precio de productos vendidos por peso se calcula por kilogramo aunque la cantidad viaje en gramos.
- **Deuda**: listado y registro de abonos.
- **Resumen**: KPIs para el dashboard (ventas, deudas, stock bajo).

**Frontend**:

- Landing animada, login y registro.
- Dashboard protegido (verifica sesión vía `GET /auth/perfil` antes de renderizar).
- 5 módulos con interfaz CRUD completa: Clientes, Proveedores, Productos, Ventas, Deudas.
- Paginación (en curso de extenderse a todos los módulos).

## Requisitos previos

- Node.js 20+
- Docker y Docker Compose
- npm

## Puesta en marcha local

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/juanjosevasquez1313-ai/sistema-gestion-negocios.git
   cd sistema-gestion-negocios
   ```

2. **Levantar la base de datos**

   ```bash
   docker compose up -d
   ```

3. **Backend**

   ```bash
   cd backend
   cp .env.example .env     # completar DATABASE_URL y JWT_SECRET
   npm install
   npx prisma migrate dev
   npm run start:dev        # http://localhost:3000
   ```

   > El backend debe iniciarse **antes** que el frontend: si no, Next.js toma el puerto usado por defecto y el backend falla con `EADDRINUSE`.

4. **Frontend** (en otra terminal)

   ```bash
   cd frontend
   npm install
   npm run dev               # http://localhost:3001
   ```

5. Abrir `http://localhost:3001`, crear una cuenta desde **Crear cuenta** (esto crea el negocio y el primer usuario ADMIN) e iniciar sesión.

## Variables de entorno

Backend (`backend/.env`, ver `backend/.env.example`):

| Variable | Descripción | Por defecto |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | — (requerida) |
| `JWT_SECRET` | Secreto para firmar el JWT | — (requerida, sin fallback) |
| `JWT_EXPIRES_IN` | Expiración del JWT | `2h` |
| `NODE_ENV` | `development` o `production`, controla flags de cookies | `development` |
| `PORT` | Puerto del backend | `3000` |

## Scripts disponibles

**Backend** (`backend/`)

| Script | Descripción |
|---|---|
| `npm run start:dev` | Servidor en modo watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta el build de producción |
| `npm run test` / `test:e2e` / `test:cov` | Tests unitarios / e2e / cobertura |
| `npm run lint` | ESLint con `--fix` (reescribe archivos; revisar el diff antes de commitear) |

**Frontend** (`frontend/`)

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3001) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

## Autenticación y roles

- JWT emitido en login/registro, entregado como cookie `httpOnly` (con soporte adicional de header `Bearer`).
- `negocioId` y `usuarioId` se leen siempre del JWT decodificado — nunca de datos enviados por el cliente.
- Roles: `ADMIN` y `VENDEDOR`.
  - Cliente: crear/listar/ver → cualquier rol; editar/eliminar → solo ADMIN.
  - Producto: listar/ver → cualquier rol; crear/editar/eliminar → solo ADMIN.
  - Proveedor y Categoría: módulo completo solo ADMIN.
  - Venta y Deuda: sin restricción de rol.

## Estado del proyecto

- ✅ Backend: 7 módulos completos, multi-tenancy y matriz de roles verificadas.
- ✅ Frontend: landing, auth y 5 módulos CRUD funcionando.
- ✅ Backlog de seguridad inicial cerrado (rate limiting, Helmet, `.env.example`, guards explícitos).
- 🔄 En curso: extender la paginación (ya implementada en Clientes) al resto de módulos.
- ⏳ Pendiente: tests automatizados, CI, y deploy (Vercel + Railway), pospuesto hasta cerrar lo anterior.

---

Proyecto personal de aprendizaje y portafolio — construido como base de un ERP multi-tenant real, con foco en seguridad y arquitectura desde el día uno.
