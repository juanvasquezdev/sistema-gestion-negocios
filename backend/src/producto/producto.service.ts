import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async crear(negocioId: string, dto: CreateProductoDto) {
    // Validación multi-tenant: la categoría debe pertenecer a ESTE negocio.
    // Sin esto, cualquier usuario podría enlazar su producto a una categoría
    // de otro negocio con solo adivinar/probar un UUID.
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: dto.categoriaId, negocioId },
    });
    if (!categoria) {
      throw new BadRequestException('La categoría no existe o no pertenece a este negocio');
    }

    // Mismo control para proveedor, pero solo si lo mandaron (es opcional)
    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findFirst({
        where: { id: dto.proveedorId, negocioId },
      });
      if (!proveedor) {
        throw new BadRequestException('El proveedor no existe o no pertenece a este negocio');
      }
    }

    const { stockInicial, stockMinimo, ...datosProducto } = dto;

    // Transacción: si falla la creación del Inventario, el Producto tampoco se crea.
    // Así nunca queda un producto sin su registro de stock.
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

      // Devolvemos el producto con su inventario incluido, útil para el frontend
      return tx.producto.findUniqueOrThrow({
        where: { id: producto.id },
        include: { inventario: true, categoria: true, proveedor: true },
      });
    });
  }

  async listar(negocioId: string) {
    return this.prisma.producto.findMany({
      where: { negocioId },
      include: { inventario: true, categoria: true, proveedor: true },
      orderBy: { nombre: 'asc' },
    });
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

    // Si cambian de categoría o proveedor, revalidamos que sigan siendo de este negocio
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
    // El Inventario se borra en cascada solo si tu schema tiene onDelete: Cascade
    // en esa relación. Si no lo tiene, Prisma fallará con FK error — lo revisamos
    // si te pasa al probar.
    return this.prisma.producto.delete({ where: { id } });
  }
}
