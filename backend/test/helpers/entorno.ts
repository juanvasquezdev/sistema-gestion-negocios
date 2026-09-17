import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

const RUTA_ENV_TEST = resolve(__dirname, '..', '..', '.env.test');

// Carga backend/.env.test y aborta si DATABASE_URL no apunta a una base *_test.
// Pisa lo que ya haya en process.env a propósito: importar @prisma/client carga el .env de
// desarrollo, y process.loadEnvFile() no sobrescribe variables existentes (pasó en la primera
// corrida: globalSetup abortó con la base sistema_negocios). ConfigModule y PrismaClient leen
// process.env recién al construirse, así que toman estos valores.
export function cargarEnvDeTest(): void {
  const variables = parseEnv(readFileSync(RUTA_ENV_TEST, 'utf8'));
  for (const [clave, valor] of Object.entries(variables)) {
    process.env[clave] = valor;
  }
  exigirBaseDeTest(nombreDeBase(process.env.DATABASE_URL));
}

export function nombreDeBase(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).pathname.slice(1);
  } catch {
    return '';
  }
}

export function exigirBaseDeTest(nombre: string): void {
  if (!nombre.endsWith('_test')) {
    throw new Error(
      `[e2e] ABORTADO: la base es "${nombre || '(vacía)'}", no una base *_test. ` +
        'Los tests nunca deben tocar la base de desarrollo.',
    );
  }
}
