import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(private prisma: PrismaService) {}

  async crear(negocioId: string, dto: CreateProveedorDto) {
    return this.prisma.proveedor.create({
      data: { ...dto, negocioId },
    });
  }

  async listar(negocioId: string) {
    return this.prisma.proveedor.findMany({
      where: { negocioId },
      orderBy: { nombre: 'asc' },
    });
  }

  async buscarUno(negocioId: string, id: string) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, negocioId },
    });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    return proveedor;
  }

  async actualizar(negocioId: string, id: string, dto: UpdateProveedorDto) {
    await this.buscarUno(negocioId, id);
    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }

  async eliminar(negocioId: string, id: string) {
    await this.buscarUno(negocioId, id);
    return this.prisma.proveedor.delete({ where: { id } });
  }
}
