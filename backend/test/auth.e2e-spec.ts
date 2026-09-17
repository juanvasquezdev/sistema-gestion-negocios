import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Negocio } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, crearApp, obtenerToken } from './helpers/app';
import {
  PASSWORD_E2E,
  crearNegocio,
  crearUsuario,
  limpiarNegocios,
  nuevoIdCorrida,
} from './helpers/datos';

// Rate limit: POST /auth/login permite 5 intentos por minuto por IP, contados por instancia de
// la app. Este describe hace 3 logins por HTTP (válido, contraseña incorrecta, usuario
// desactivado); el resto de los tokens sale de obtenerToken(), sin HTTP. Si se agregan logins
// por HTTP acá y se pasa de 5, el siguiente responde 429.
describe('Auth (e2e)', () => {
  const run = nuevoIdCorrida();
  const emailAdmin = `admin-${run}@e2e.test`;
  const emailVendedor = `vendedor-${run}@e2e.test`;
  const emailDesactivado = `desactivado-${run}@e2e.test`;

  let app: NestExpressApplication;
  let prisma: PrismaService;
  let negocio: Negocio;
  let productoId: string;

  beforeAll(async () => {
    app = await crearApp();
    prisma = app.get(PrismaService);

    negocio = await crearNegocio(prisma, 'Auth', run);
    await crearUsuario(prisma, { negocioId: negocio.id, rol: 'ADMIN', email: emailAdmin });
    await crearUsuario(prisma, { negocioId: negocio.id, rol: 'VENDEDOR', email: emailVendedor });
    await crearUsuario(prisma, { negocioId: negocio.id, rol: 'ADMIN', email: emailDesactivado });

    const categoria = await prisma.categoria.create({
      data: { negocioId: negocio.id, nombre: 'Categoría e2e' },
    });
    const producto = await prisma.producto.create({
      data: {
        negocioId: negocio.id,
        categoriaId: categoria.id,
        nombre: 'Producto e2e',
        unidadMedida: 'UNIDAD',
        precioVenta: 1000,
      },
    });
    await prisma.inventario.create({
      data: { negocioId: negocio.id, productoId: producto.id, stockActual: 10 },
    });
    productoId = producto.id;
  });

  afterAll(async () => {
    if (prisma && negocio) await limpiarNegocios(prisma, [negocio.id]);
    await app?.close();
  });

  it('login válido: 200, accessToken y cookie httpOnly; el token sirve por cookie y por Bearer', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailAdmin, password: PASSWORD_E2E })
      .expect(200);

    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.usuario).toMatchObject({
      email: emailAdmin,
      rol: 'ADMIN',
      negocioId: negocio.id,
    });

    const setCookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const cookieToken = setCookie.find((c) => c.startsWith('token='));
    expect(cookieToken).toBeDefined();
    expect(cookieToken).toContain('HttpOnly');

    const porCookie = await request(app.getHttpServer())
      .get('/auth/perfil')
      .set('Cookie', cookieToken!.split(';')[0])
      .expect(200);
    expect(porCookie.body).toMatchObject({ email: emailAdmin, negocioId: negocio.id });

    const porBearer = await request(app.getHttpServer())
      .get('/auth/perfil')
      .set(bearer(res.body.accessToken))
      .expect(200);
    expect(porBearer.body).toMatchObject({ email: emailAdmin, negocioId: negocio.id });
  });

  it('login con contraseña incorrecta: 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: emailAdmin, password: 'contraseña-incorrecta' })
      .expect(401);
  });

  it('endpoint protegido sin token: 401', async () => {
    await request(app.getHttpServer()).get('/productos').expect(401);
  });

  it('VENDEDOR en un endpoint solo ADMIN (DELETE /productos/:id): 403 y el producto sigue existiendo', async () => {
    const token = await obtenerToken(app, emailVendedor);

    await request(app.getHttpServer())
      .delete(`/productos/${productoId}`)
      .set(bearer(token))
      .expect(403);

    expect(await prisma.producto.findUnique({ where: { id: productoId } })).not.toBeNull();
  });

  describe('usuario desactivado', () => {
    let tokenEmitidoAntes: string;

    beforeAll(async () => {
      tokenEmitidoAntes = await obtenerToken(app, emailDesactivado);
      await prisma.usuario.update({ where: { email: emailDesactivado }, data: { activo: false } });
    });

    it('GET /auth/perfil con un token emitido antes de desactivarlo: 401', async () => {
      await request(app.getHttpServer())
        .get('/auth/perfil')
        .set(bearer(tokenEmitidoAntes))
        .expect(401);
    });

    it('login: 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: emailDesactivado, password: PASSWORD_E2E })
        .expect(401);
    });

    // Documenta el hueco T4 (backend/SECURITY-BACKLOG.md): JwtStrategy.validate() no consulta la
    // base, así que un usuario desactivado sigue operando hasta que vence su token (2 h). Hoy
    // responde 200, por eso el test está marcado como .failing. Cuando se arregle T4, este test
    // empieza a "fallar": quitar el .failing y dejarlo como test normal.
    test.failing('T4: endpoint de negocio (GET /productos) con ese token: debería ser 401', async () => {
      await request(app.getHttpServer())
        .get('/productos')
        .set(bearer(tokenEmitidoAntes))
        .expect(401);
    });
  });
});

// Instancia aparte: el contador del rate limit vive en memoria por app, así este caso no
// consume los intentos del describe anterior ni depende de su orden.
describe('Rate limit de POST /auth/login (e2e, app aparte)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('5 intentos por minuto: el 6.º responde 429 con el mensaje en español', async () => {
    const intento = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `no-existe-${nuevoIdCorrida()}@e2e.test`, password: 'x' });

    for (let i = 1; i <= 5; i++) {
      await intento().expect(401);
    }

    const res = await intento().expect(429);
    expect(res.body.message).toBe('Demasiados intentos. Espera un minuto e intenta de nuevo.');
  });
});
