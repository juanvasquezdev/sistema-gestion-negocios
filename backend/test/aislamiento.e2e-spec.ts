import request from 'supertest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Negocio } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { bearer, crearApp, obtenerToken } from './helpers/app';
import { crearNegocio, crearUsuario, limpiarNegocios, nuevoIdCorrida } from './helpers/datos';

// Aislamiento multi-tenant: el negocioId sale siempre del JWT. Cada caso comprueba la
// respuesta HTTP y, cuando hay escritura, también el estado real en la base.
// Si alguno de estos tests falla, NO ajustarlo para que pase: puede ser una fuga real.
describe('Aislamiento multi-tenant (e2e)', () => {
  const run = nuevoIdCorrida();

  let app: NestExpressApplication;
  let prisma: PrismaService;
  let negocioA: Negocio;
  let negocioB: Negocio;
  let tokenA: string;
  let tokenB: string;

  let productoA: { id: string; nombre: string };
  let clienteA: { id: string; nombre: string };
  let productoB: { id: string; categoriaId: string };
  let clienteB: { id: string; nombre: string };

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await crearApp();
    prisma = app.get(PrismaService);

    negocioA = await crearNegocio(prisma, 'A', run);
    negocioB = await crearNegocio(prisma, 'B', run);
    const emailA = `admin-a-${run}@e2e.test`;
    const emailB = `admin-b-${run}@e2e.test`;
    await crearUsuario(prisma, { negocioId: negocioA.id, rol: 'ADMIN', email: emailA });
    await crearUsuario(prisma, { negocioId: negocioB.id, rol: 'ADMIN', email: emailB });
    tokenA = await obtenerToken(app, emailA);
    tokenB = await obtenerToken(app, emailB);

    // Cada negocio crea sus datos por la API, como en uso real.
    const crearDatos = async (token: string, etiqueta: string) => {
      const categoria = await http()
        .post('/categoria')
        .set(bearer(token))
        .send({ nombre: `Categoría ${etiqueta}` })
        .expect(201);
      const producto = await http()
        .post('/productos')
        .set(bearer(token))
        .send({
          nombre: `Producto ${etiqueta}`,
          categoriaId: categoria.body.id,
          unidadMedida: 'UNIDAD',
          precioVenta: 1000,
          stockInicial: 10,
        })
        .expect(201);
      const cliente = await http()
        .post('/clientes')
        .set(bearer(token))
        .send({ nombre: `Cliente ${etiqueta}`, documento: `${etiqueta}-${run}` })
        .expect(201);
      return { producto: producto.body, cliente: cliente.body };
    };

    const datosA = await crearDatos(tokenA, 'A');
    const datosB = await crearDatos(tokenB, 'B');
    productoA = datosA.producto;
    clienteA = datosA.cliente;
    productoB = datosB.producto;
    clienteB = datosB.cliente;

    expect(datosA.producto.negocioId).toBe(negocioA.id);
    expect(datosB.producto.negocioId).toBe(negocioB.id);
  });

  afterAll(async () => {
    const ids = [negocioA?.id, negocioB?.id].filter((id): id is string => Boolean(id));
    if (prisma) await limpiarNegocios(prisma, ids);
    await app?.close();
  });

  describe('producto de A, pedido por B por id', () => {
    it('GET /productos/:id: 404', async () => {
      await http().get(`/productos/${productoA.id}`).set(bearer(tokenB)).expect(404);
    });

    it('PATCH /productos/:id: 404 y el producto no cambia', async () => {
      await http()
        .patch(`/productos/${productoA.id}`)
        .set(bearer(tokenB))
        .send({ nombre: 'Modificado por B' })
        .expect(404);

      const enBase = await prisma.producto.findUnique({ where: { id: productoA.id } });
      expect(enBase).toMatchObject({ nombre: productoA.nombre, negocioId: negocioA.id });
    });

    it('DELETE /productos/:id: 404 y el producto sigue existiendo', async () => {
      await http().delete(`/productos/${productoA.id}`).set(bearer(tokenB)).expect(404);

      expect(await prisma.producto.findUnique({ where: { id: productoA.id } })).not.toBeNull();
    });
  });

  describe('cliente de A, pedido por B por id', () => {
    it('GET /clientes/:id: 404', async () => {
      await http().get(`/clientes/${clienteA.id}`).set(bearer(tokenB)).expect(404);
    });

    it('PATCH /clientes/:id: 404 y el cliente no cambia', async () => {
      await http()
        .patch(`/clientes/${clienteA.id}`)
        .set(bearer(tokenB))
        .send({ nombre: 'Modificado por B' })
        .expect(404);

      const enBase = await prisma.cliente.findUnique({ where: { id: clienteA.id } });
      expect(enBase).toMatchObject({ nombre: clienteA.nombre, negocioId: negocioA.id });
    });

    it('DELETE /clientes/:id: 404 y el cliente sigue existiendo', async () => {
      await http().delete(`/clientes/${clienteA.id}`).set(bearer(tokenB)).expect(404);

      expect(await prisma.cliente.findUnique({ where: { id: clienteA.id } })).not.toBeNull();
    });
  });

  describe('listados de B', () => {
    it('GET /productos: solo productos de B', async () => {
      const res = await http().get('/productos').set(bearer(tokenB)).expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data.map((p: { id: string }) => p.id)).toEqual([productoB.id]);
      expect(
        res.body.data.every((p: { negocioId: string }) => p.negocioId === negocioB.id),
      ).toBe(true);
    });

    it('GET /productos/selector: solo productos de B', async () => {
      const res = await http().get('/productos/selector').set(bearer(tokenB)).expect(200);

      expect(res.body.map((p: { id: string }) => p.id)).toEqual([productoB.id]);
    });

    it('GET /clientes: solo clientes de B', async () => {
      const res = await http().get('/clientes').set(bearer(tokenB)).expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data.map((c: { id: string }) => c.id)).toEqual([clienteB.id]);
      expect(
        res.body.data.every((c: { negocioId: string }) => c.negocioId === negocioB.id),
      ).toBe(true);
    });

    it('GET /clientes/selector: solo clientes de B', async () => {
      const res = await http().get('/clientes/selector').set(bearer(tokenB)).expect(200);

      expect(res.body.map((c: { id: string }) => c.id)).toEqual([clienteB.id]);
    });
  });

  // Hoy el negocioId del body no se "ignora": ValidationPipe (forbidNonWhitelisted) rechaza la
  // petición con 400 porque ningún DTO lo declara. En los PATCH es la única barrera, porque
  // actualizar() hace update({ where: { id }, data: dto }) (ver backlog de defensa en profundidad).
  describe('B envía el negocioId de A en el body', () => {
    it('POST /clientes: 400 y no se crea nada en ningún negocio', async () => {
      const res = await http()
        .post('/clientes')
        .set(bearer(tokenB))
        .send({ nombre: 'Intruso', negocioId: negocioA.id })
        .expect(400);

      expect(res.body.message).toContain('property negocioId should not exist');
      expect(await prisma.cliente.count({ where: { negocioId: negocioA.id } })).toBe(1);
      expect(await prisma.cliente.count({ where: { negocioId: negocioB.id } })).toBe(1);
    });

    it('POST /productos: 400 y no se crea nada en ningún negocio', async () => {
      const res = await http()
        .post('/productos')
        .set(bearer(tokenB))
        .send({
          nombre: 'Intruso',
          categoriaId: productoB.categoriaId,
          unidadMedida: 'UNIDAD',
          precioVenta: 1,
          stockInicial: 1,
          negocioId: negocioA.id,
        })
        .expect(400);

      expect(res.body.message).toContain('property negocioId should not exist');
      expect(await prisma.producto.count({ where: { negocioId: negocioA.id } })).toBe(1);
      expect(await prisma.producto.count({ where: { negocioId: negocioB.id } })).toBe(1);
    });

    it('PATCH /clientes/:id (cliente propio de B): 400 y el cliente sigue en B, sin cambios', async () => {
      const res = await http()
        .patch(`/clientes/${clienteB.id}`)
        .set(bearer(tokenB))
        .send({ nombre: 'Movido a A', negocioId: negocioA.id })
        .expect(400);

      expect(res.body.message).toContain('property negocioId should not exist');
      const enBase = await prisma.cliente.findUnique({ where: { id: clienteB.id } });
      expect(enBase).toMatchObject({ nombre: clienteB.nombre, negocioId: negocioB.id });
    });
  });

  describe('venta de B con datos de A', () => {
    it('cliente de A: 400', async () => {
      const res = await http()
        .post('/ventas')
        .set(bearer(tokenB))
        .send({ clienteId: clienteA.id, detalles: [{ productoId: productoB.id, cantidad: 1 }] })
        .expect(400);

      expect(res.body.message).toBe('El cliente no existe o no pertenece a este negocio');
    });

    it('producto de A: 400, sin ventas y sin tocar el stock de A', async () => {
      const res = await http()
        .post('/ventas')
        .set(bearer(tokenB))
        .send({ clienteId: clienteB.id, detalles: [{ productoId: productoA.id, cantidad: 1 }] })
        .expect(400);

      expect(res.body.message).toBe(
        'Uno o más productos no existen o no pertenecen a este negocio',
      );
      expect(
        await prisma.venta.count({ where: { negocioId: { in: [negocioA.id, negocioB.id] } } }),
      ).toBe(0);
      const inventarioA = await prisma.inventario.findUnique({
        where: { productoId: productoA.id },
      });
      expect(Number(inventarioA?.stockActual)).toBe(10);
    });
  });
});
