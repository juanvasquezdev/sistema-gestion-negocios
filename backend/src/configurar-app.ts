import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { ThrottlerExceptionFilter } from './common/throttler-exception.filter';

// Configuración global compartida entre main.ts y los tests e2e (test/helpers/app.ts),
// para que los tests corran con exactamente los mismos pipes, filtros y middlewares
// que producción. CORS y listen() quedan en main.ts: solo aplican al servidor real.
export function configurarApp(app: NestExpressApplication): void {
  app.use(helmet());

  // Confía solo en el primer hop del proxy (Railway) para que el rate
  // limiting use la IP real del cliente y no la del proxy.
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter(), new ThrottlerExceptionFilter());

  app.use(cookieParser());
}
