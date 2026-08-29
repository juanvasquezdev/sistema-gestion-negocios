import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';

@Injectable()
export class DeudaService {
  constructor(private prisma: PrismaService) {}

  async listar(negocioId: string) {
    return this.prisma.deuda.findMany({
      where: { negocioId },
      include: { cliente: true, venta: true },
      orderBy: { createdAt: 'desc' },
    });
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
