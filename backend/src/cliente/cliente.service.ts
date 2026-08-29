import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}

  async crear(negocioId: string, dto: CreateClienteDto) {
    if (dto.documento) {
      const existente = await this.prisma.cliente.findFirst({
        where: { negocioId, documento: dto.documento },
      });
      if (existente) {
        throw new ConflictException(
          'Ya existe un cliente con ese documento en este negocio',
        );
      }
    }

    return this.prisma.cliente.create({
      data: { ...dto, negocioId },
    });
  }

  async listar(negocioId: string) {
    return this.prisma.cliente.findMany({
      where: { negocioId },
      orderBy: { nombre: 'asc' },
    });
  }

  async buscarUno(negocioId: string, id: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  async actualizar(negocioId: string, id: string, dto: UpdateClienteDto) {
    await this.buscarUno(negocioId, id);

    if (dto.documento) {
      const existente = await this.prisma.cliente.findFirst({
        where: { negocioId, documento: dto.documento, NOT: { id } },
      });
      if (existente) {
        throw new ConflictException(
          'Ya existe otro cliente con ese documento en este negocio',
        );
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data: dto,
    });
  }

  async eliminar(negocioId: string, id: string) {
    await this.buscarUno(negocioId, id); // valida existencia + pertenencia
    return this.prisma.cliente.delete({ where: { id } });
  }
}
