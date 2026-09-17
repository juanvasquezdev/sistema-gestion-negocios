import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../../src/app.module';
import { configurarApp } from '../../src/configurar-app';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { exigirBaseDeTest } from './entorno';
import { PASSWORD_E2E } from './datos';

// App completa con la misma configuración que main.ts (configurarApp), sin listen().
export async function crearApp(): Promise<NestExpressApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = modulo.createNestApplication<NestExpressApplication>();
  configurarApp(app);
  await app.init();

  // Última defensa: pregunta a la conexión real a qué base quedó conectada.
  const [{ current_database }] = await app
    .get(PrismaService)
    .$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
  try {
    exigirBaseDeTest(current_database);
  } catch (error) {
    await app.close();
    throw error;
  }

  return app;
}

// Token real (AuthService.login, mismo payload que el endpoint) sin pasar por HTTP,
// así no consume el rate limit de POST /auth/login (5 por minuto por instancia de la app).
export async function obtenerToken(
  app: NestExpressApplication,
  email: string,
  password = PASSWORD_E2E,
): Promise<string> {
  const { accessToken } = await app.get(AuthService).login({ email, password });
  return accessToken;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
