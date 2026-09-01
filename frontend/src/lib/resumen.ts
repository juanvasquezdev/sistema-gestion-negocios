import { api } from './api';
import type { UnidadMedida } from './productos';

export interface VentaDia {
  fecha: string;
  total: number;
}

export interface DeudaResumen {
  id: string;
  cliente: string;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL';
  fechaLimite: string | null;
}

export interface ProductoStockBajo {
  id: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: UnidadMedida;
}

export interface ResumenResponse {
  ventasHoy: { monto: number; cantidad: number };
  ventasMes: { monto: number; cantidad: number };
  ventasUltimos7Dias: VentaDia[];
  totalPorCobrar: number;
  deudasPendientes: DeudaResumen[];
  productosStockBajo: ProductoStockBajo[];
  totalClientes: number;
  totalProductosActivos: number;
}

export function obtenerResumen() {
  return api.get<ResumenResponse>('/resumen');
}