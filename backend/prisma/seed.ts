import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { nombre: 'ADMIN', descripcion: 'Administrador del negocio, acceso total' },
    { nombre: 'VENDEDOR', descripcion: 'Registra ventas y consulta productos/clientes' },
  ];

  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: {},
      create: rol,
    });
  }

  console.log('Roles sembrados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  