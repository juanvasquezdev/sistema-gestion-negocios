import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) {}

  crear(negocioId: string, dto: CrearCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        ...dto,
        negocioId,
      },
    });
  }

  listar(negocioId: string) {
    return this.prisma.categoria.findMany({
      where: { negocioId },
      orderBy: { nombre: 'asc' },
    });
  }

  async buscarUno(negocioId: string, id: string) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, negocioId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada.');
    }

    return categoria;
  }

  async actualizar(
    negocioId: string,
    id: string,
    dto: ActualizarCategoriaDto,
  ) {
    await this.buscarUno(negocioId, id); // valida existencia + pertenencia

    return this.prisma.categoria.update({
      where: { id },
      data: dto,
    });
  }

  async eliminar(negocioId: string, id: string) {
    await this.buscarUno(negocioId, id); // valida existencia + pertenencia

    return this.prisma.categoria.delete({
      where: { id },
    });
  }
}
