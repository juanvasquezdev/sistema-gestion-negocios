import { api } from './api';
import type { Cliente } from './clientes';
import type { RespuestaPaginada } from './paginacion';

export interface DetalleVenta {
  id: string;
  productoId: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: string;
}

export interface Venta {
  id: string;
  negocioId: string;
  clienteId: string;
  usuarioId: string;
  fecha: string;
  total: string;
  estado: 'PAGADA' | 'PENDIENTE';
  detalles: DetalleVenta[];
  cliente?: Cliente;
}

export interface DetalleVentaInput {
  productoId: string;
  cantidad: number;
}

export interface VentaInput {
  clienteId: string;
  estado?: 'PAGADA' | 'PENDIENTE';
  detalles: DetalleVentaInput[];
}

export function listarVentas(pagina = 1, limite = 20) {
  return api.get<RespuestaPaginada<Venta>>(
    `/ventas?pagina=${pagina}&limite=${limite}`
  );
}

export function crearVenta(data: VentaInput) {
  return api.post<Venta>('/ventas', data);
}