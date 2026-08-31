import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PaginacionDto } from '../common/dto/paginacion.dto';
@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async crear(negocioId: string, dto: CreateProductoDto) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: dto.categoriaId, negocioId },
    });
    if (!categoria) {
      throw new BadRequestException('La categoría no existe o no pertenece a este negocio');
    }

    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findFirst({
        where: { id: dto.proveedorId, negocioId },
      });
      if (!proveedor) {
        throw new BadRequestException('El proveedor no existe o no pertenece a este negocio');
      }
    }

    const { stockInicial, stockMinimo, ...datosProducto } = dto;

    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.create({
        data: { ...datosProducto, negocioId },
      });

      await tx.inventario.create({
        data: {
          negocioId,
          productoId: producto.id,
          stockActual: stockInicial,
          stockMinimo: stockMinimo ?? null,
        },
      });

      return tx.producto.findUniqueOrThrow({
        where: { id: producto.id },
        include: { inventario: true, categoria: true, proveedor: true },
      });
    });
  }

  async listar(negocioId: string, { pagina, limite }: PaginacionDto) {
    const skip = (pagina - 1) * limite;
    const [data, total] = await Promise.all([
      this.prisma.producto.findMany({
        where: { negocioId },
        include: { inventario: true, categoria: true, proveedor: true },
        orderBy: { nombre: 'asc' },
        skip,
        take: limite,
      }),
      this.prisma.producto.count({ where: { negocioId } }),
    ]);
    return { data, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
  }
  async buscarUno(negocioId: string, id: string) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, negocioId },
      include: { inventario: true, categoria: true, proveedor: true },
    });
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }
    return producto;
  }

  async actualizar(negocioId: string, id: string, dto: UpdateProductoDto) {
    await this.buscarUno(negocioId, id);

    if (dto.categoriaId) {
      const categoria = await this.prisma.categoria.findFirst({
        where: { id: dto.categoriaId, negocioId },
      });
      if (!categoria) {
        throw new BadRequestException('La categoría no existe o no pertenece a este negocio');
      }
    }
    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findFirst({
        where: { id: dto.proveedorId, negocioId },
      });
      if (!proveedor) {
        throw new BadRequestException('El proveedor no existe o no pertenece a este negocio');
      }
    }

    return this.prisma.producto.update({
      where: { id },
      data: dto,
      include: { inventario: true, categoria: true, proveedor: true },
    });
  }

  async eliminar(negocioId: string, id: string) {
    await this.buscarUno(negocioId, id);
    return this.prisma.producto.delete({ where: { id } });
  }
}
