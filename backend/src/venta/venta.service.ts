import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';

@Injectable()
export class VentaService {
  constructor(private prisma: PrismaService) {}

  async crear(negocioId: string, usuarioId: string, dto: CreateVentaDto) {
    // 1. Validar que el cliente sea de este negocio
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: dto.clienteId, negocioId },
    });
    if (!cliente) {
      throw new BadRequestException('El cliente no existe o no pertenece a este negocio');
    }

    // 2. Traer todos los productos pedidos de una sola vez, con su inventario
    const productoIds = dto.detalles.map((d) => d.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds }, negocioId },
      include: { inventario: true },
    });

    if (productos.length !== productoIds.length) {
      throw new BadRequestException('Uno o más productos no existen o no pertenecen a este negocio');
    }

    // 3. Verificar stock suficiente ANTES de tocar la base de datos
    //    (el stock siempre vive en gramos/unidades, tal cual lo manda el cliente)
    for (const item of dto.detalles) {
      const producto = productos.find((p) => p.id === item.productoId)!;
      const stockDisponible = producto.inventario?.stockActual ?? 0;
      if (Number(stockDisponible) < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}, solicitado: ${item.cantidad}`,
        );
      }
    }

    // 4. Armar los detalles con precio congelado al momento de la venta.
    //    Regla de negocio: precioVenta se interpreta distinto según la unidad de medida:
    //    - UNIDAD: precioVenta es por unidad, se multiplica directo por cantidad.
    //    - GRAMO: precioVenta es por KILOGRAMO (más natural para el usuario que precio/gramo),
    //      pero la cantidad viaja en gramos (nuestra unidad base de stock). Por eso se
    //      divide entre 1000 antes de multiplicar.
    const detallesData = dto.detalles.map((item) => {
      const producto = productos.find((p) => p.id === item.productoId)!;
      const precioVenta = Number(producto.precioVenta);

      let subtotal: number;
      if (producto.unidadMedida === 'GRAMO') {
        subtotal = precioVenta * (item.cantidad / 1000);
      } else {
        subtotal = precioVenta * item.cantidad;
      }

      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: precioVenta, // guardamos el precio de referencia tal cual estaba en el producto
        subtotal,
      };
    });

    const total = detallesData.reduce((acc, d) => acc + d.subtotal, 0);

    // 5. Transacción: crear Venta + DetalleVenta[] + Deuda (si aplica) + descontar stock
    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          negocioId,
          clienteId: dto.clienteId,
          usuarioId,
          estado: dto.estado ?? 'PAGADA',
          total,
          detalles: {
            create: detallesData,
          },
        },
        include: { detalles: true },
      });

      if (venta.estado === 'PENDIENTE') {
        await tx.deuda.create({
          data: {
            negocioId,
            clienteId: dto.clienteId,
            ventaId: venta.id,
            monto: total,
            saldoPendiente: total,
          },
        });
      }

      for (const item of dto.detalles) {
        await tx.inventario.update({
          where: { productoId: item.productoId },
          data: { stockActual: { decrement: item.cantidad } },
        });
      }

      return venta;
    });
  }

  async listar(negocioId: string) {
    return this.prisma.venta.findMany({
      where: { negocioId },
      include: { detalles: true, cliente: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async buscarUno(negocioId: string, id: string) {
    const venta = await this.prisma.venta.findFirst({
      where: { id, negocioId },
      include: { detalles: { include: { producto: true } }, cliente: true },
    });
    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }
    return venta;
  }
}
