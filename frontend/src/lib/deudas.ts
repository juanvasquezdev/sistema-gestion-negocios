import { api } from './api';
import type { Cliente } from './clientes';

export interface Deuda {
  id: string;
  negocioId: string;
  clienteId: string;
  ventaId: string;
  monto: string;
  saldoPendiente: string;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA';
  fechaLimite: string | null;
  createdAt: string;
  cliente?: Cliente;
}

export function listarDeudas() {
  return api.get<Deuda[]>('/deudas');
}

export function registrarAbono(id: string, monto: number) {
  return api.patch<Deuda>(`/deudas/${id}/abono`, { monto });
}