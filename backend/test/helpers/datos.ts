import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';

// Todo negocio creado por los tests lleva este prefijo: globalSetup borra los que hayan
// quedado de una corrida que se cortó a la mitad.
export const PREFIJO_E2E = '[e2e]';
export const PASSWORD_E2E = 'password-e2e-123';

export const ROLES = [
  { nombre: 'ADMIN', descripcion: 'Administrador del negocio, acceso total' },
  { nombre: 'VENDEDOR', descripcion: 'Registra ventas y consulta productos/clientes' },
];

export function nuevoIdCorrida(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function crearNegocio(prisma: PrismaClient, etiqueta: string, idCorrida: string) {
  return prisma.negocio.create({
    data: { nombre: `${PREFIJO_E2E} ${etiqueta} ${idCorrida}` },
  });
}

// Los usuarios se crean directo con Prisma: no hay endpoint para crear un VENDEDOR.
// bcrypt con costo 4 (producción usa 12): compare() acepta cualquier costo y el login
// tarda milisegundos en vez de ~250 ms.
export async function crearUsuario(
  prisma: PrismaClient,
  datos: { negocioId: string; rol: 'ADMIN' | 'VENDEDOR'; email: string; activo?: boolean },
) {
  const rol = await prisma.rol.findUniqueOrThrow({ where: { nombre: datos.rol } });
  return prisma.usuario.create({
    data: {
      negocioId: datos.negocioId,
      rolId: rol.id,
      nombre: `Usuario ${datos.rol}`,
      email: datos.email,
      passwordHash: await bcrypt.hash(PASSWORD_E2E, 4),
      activo: datos.activo ?? true,
    },
  });
}

// Borra todo lo de esos negocios, en orden de FK (ninguna relación tiene ON DELETE CASCADE).
export async function limpiarNegocios(prisma: PrismaClient, negocioIds: string[]) {
  if (negocioIds.length === 0) return;
  const where = { negocioId: { in: negocioIds } };
  await prisma.$transaction([
    prisma.deuda.deleteMany({ where }),
    prisma.detalleVenta.deleteMany({ where: { venta: where } }),
    prisma.venta.deleteMany({ where }),
    prisma.inventario.deleteMany({ where }),
    prisma.producto.deleteMany({ where }),
    prisma.categoria.deleteMany({ where }),
    prisma.proveedor.deleteMany({ where }),
    prisma.cliente.deleteMany({ where }),
    prisma.usuario.deleteMany({ where }),
    prisma.negocio.deleteMany({ where: { id: { in: negocioIds } } }),
  ]);
}

export async function limpiarRestosE2E(prisma: PrismaClient): Promise<number> {
  const restos = await prisma.negocio.findMany({
    where: { nombre: { startsWith: PREFIJO_E2E } },
    select: { id: true },
  });
  await limpiarNegocios(
    prisma,
    restos.map((n) => n.id),
  );
  return restos.length;
}
