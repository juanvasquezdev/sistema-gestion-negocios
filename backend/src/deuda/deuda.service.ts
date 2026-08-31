import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';
import { PaginacionDto } from '../common/dto/paginacion.dto';
@Injectable()
export class DeudaService {
  constructor(private prisma: PrismaService) {}

  async listar(negocioId: string, { pagina, limite }: PaginacionDto) {
    const skip = (pagina - 1) * limite;
    const [data, total] = await Promise.all([
      this.prisma.deuda.findMany({
        where: { negocioId },
        include: { cliente: true, venta: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.deuda.count({ where: { negocioId } }),
    ]);
    return { data, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
  }

  async buscarUno(negocioId: string, id: string) {
    const deuda = await this.prisma.deuda.findFirst({
      where: { id, negocioId },
      include: { cliente: true, venta: { include: { detalles: true } } },
    });
    if (!deuda) {
      throw new NotFoundException('Deuda no encontrada');
    }
    return deuda;
  }

  async registrarAbono(negocioId: string, id: string, dto: RegistrarAbonoDto) {
    const deuda = await this.buscarUno(negocioId, id);

    const saldoActual = Number(deuda.saldoPendiente);
    if (dto.monto > saldoActual) {
      throw new BadRequestException(
        `El abono (${dto.monto}) supera el saldo pendiente (${saldoActual})`,
      );
    }

    const nuevoSaldo = saldoActual - dto.monto;
    const nuevoEstado =
      nuevoSaldo === 0 ? 'PAGADA' : nuevoSaldo < saldoActual ? 'PARCIAL' : 'PENDIENTE';

    return this.prisma.deuda.update({
      where: { id },
      data: {
        saldoPendiente: nuevoSaldo,
        estado: nuevoEstado,
      },
    });
  }
}
