import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResumenService {
  constructor(private prisma: PrismaService) {}

  async obtenerResumen(negocioId: string) {
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const hoyFin = new Date(hoyInicio);
    hoyFin.setHours(23, 59, 59, 999);
    const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const sieteDiasAtras = new Date(hoyInicio);
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 6);

    const [
      ventasHoyAgg,
      ventasMesAgg,
      ventasSemana,
      deudasAgg,
      deudasPendientesRaw,
      productosActivos,
      totalClientes,
    ] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { negocioId, fecha: { gte: hoyInicio, lte: hoyFin } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.venta.aggregate({
        where: { negocioId, fecha: { gte: mesInicio } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.venta.findMany({
        where: { negocioId, fecha: { gte: sieteDiasAtras } },
        select: { fecha: true, total: true },
      }),
      this.prisma.deuda.aggregate({
        where: { negocioId, estado: { in: ['PENDIENTE', 'PARCIAL'] } },
        _sum: { saldoPendiente: true },
      }),
      this.prisma.deuda.findMany({
        where: { negocioId, estado: { in: ['PENDIENTE', 'PARCIAL'] } },
        include: { cliente: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.producto.findMany({
        where: { negocioId, activo: true },
        include: { inventario: true },
      }),
      this.prisma.cliente.count({ where: { negocioId } }),
    ]);

    // Agrupar ventas de los últimos 7 días (rellenando con 0 los días sin ventas)
    const mapaDias = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const dia = new Date(sieteDiasAtras);
      dia.setDate(dia.getDate() + i);
      mapaDias.set(dia.toISOString().slice(0, 10), 0);
    }
    for (const venta of ventasSemana) {
      const clave = venta.fecha.toISOString().slice(0, 10);
      if (mapaDias.has(clave)) {
        mapaDias.set(clave, (mapaDias.get(clave) ?? 0) + Number(venta.total));
      }
    }
    const ventasUltimos7Dias = Array.from(mapaDias.entries()).map(([fecha, total]) => ({
      fecha,
      total,
    }));

    const productosStockBajo = productosActivos
      .filter(
        (p) =>
          p.inventario &&
          p.inventario.stockMinimo !== null &&
          Number(p.inventario.stockActual) <= Number(p.inventario.stockMinimo),
      )
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        stockActual: Number(p.inventario!.stockActual),
        stockMinimo: Number(p.inventario!.stockMinimo),
        unidadMedida: p.unidadMedida,
      }));

    const deudasPendientes = deudasPendientesRaw.map((d) => ({
      id: d.id,
      cliente: d.cliente?.nombre ?? 'Sin cliente',
      saldoPendiente: Number(d.saldoPendiente),
      estado: d.estado as 'PENDIENTE' | 'PARCIAL',
      fechaLimite: d.fechaLimite ? d.fechaLimite.toISOString() : null,
    }));

    return {
      ventasHoy: {
        monto: Number(ventasHoyAgg._sum.total ?? 0),
        cantidad: ventasHoyAgg._count,
      },
      ventasMes: {
        monto: Number(ventasMesAgg._sum.total ?? 0),
        cantidad: ventasMesAgg._count,
      },
      ventasUltimos7Dias,
      totalPorCobrar: Number(deudasAgg._sum.saldoPendiente ?? 0),
      deudasPendientes,
      productosStockBajo,
      totalClientes,
      totalProductosActivos: productosActivos.length,
    };
  }
}
