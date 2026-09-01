import { api } from './api';
import type { Cliente } from './clientes';
import type { RespuestaPaginada } from './proveedores';

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

export function listarDeudas(pagina = 1, limite = 20) {
  return api.get<RespuestaPaginada<Deuda>>(
    `/deudas?pagina=${pagina}&limite=${limite}`
  );
}

export function registrarAbono(id: string, monto: number) {
  return api.patch<Deuda>(`/deudas/${id}/abono`, { monto });
}