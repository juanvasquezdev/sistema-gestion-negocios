import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { PaginacionDto } from '../common/dto/paginacion.dto';
@Injectable()
export class VentaService {
  constructor(private prisma: PrismaService) {}

  async crear(negocioId: string, usuarioId: string, dto: CreateVentaDto) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: dto.clienteId, negocioId },
    });
    if (!cliente) {
      throw new BadRequestException('El cliente no existe o no pertenece a este negocio');
    }

    const productoIds = dto.detalles.map((d) => d.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds }, negocioId },
      include: { inventario: true },
    });

    if (productos.length !== productoIds.length) {
      throw new BadRequestException('Uno o más productos no existen o no pertenecen a este negocio');
    }

    for (const item of dto.detalles) {
      const producto = productos.find((p) => p.id === item.productoId)!;
      const stockDisponible = producto.inventario?.stockActual ?? 0;
      if (Number(stockDisponible) < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}, solicitado: ${item.cantidad}`,
        );
      }
    }

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
        precioUnitario: precioVenta,
        subtotal,
      };
    });

    const total = detallesData.reduce((acc, d) => acc + d.subtotal, 0);

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

  async listar(negocioId: string, { pagina, limite }: PaginacionDto) {
    const skip = (pagina - 1) * limite;
    const [data, total] = await Promise.all([
      this.prisma.venta.findMany({
        where: { negocioId },
        include: { detalles: true, cliente: true },
        orderBy: { fecha: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.venta.count({ where: { negocioId } }),
    ]);
    return { data, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
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
