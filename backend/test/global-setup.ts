import { PrismaClient } from '@prisma/client';
import { cargarEnvDeTest, exigirBaseDeTest } from './helpers/entorno';
import { ROLES, limpiarRestosE2E } from './helpers/datos';

// Corre una vez antes de toda la suite e2e.
export default async function globalSetup(): Promise<void> {
  cargarEnvDeTest();

  const prisma = new PrismaClient();
  try {
    const [{ current_database }] = await prisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;
    exigirBaseDeTest(current_database);

    // Rol es una tabla: la base de test necesita las filas, igual que prisma/seed.ts.
    for (const rol of ROLES) {
      await prisma.rol.upsert({ where: { nombre: rol.nombre }, update: {}, create: rol });
    }

    const restos = await limpiarRestosE2E(prisma);
    if (restos > 0) {
      console.log(`[e2e] Limpiados ${restos} negocios de una corrida anterior.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
