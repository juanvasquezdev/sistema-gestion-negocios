import {api} from './api';
import type { RespuestaPaginada } from './paginacion';

export interface Cliente {
    id: string;
    negocioId: string;
    nombre: string;
    documento?: string;
    telefono?: string;    
}

export interface ClienteInput {
    nombre: string;
    documento?: string;
    telefono?: string;
}

export interface ClienteSelector {
  id: string;
  nombre: string;
}

export function listarClientes(pagina = 1, limite = 10) {
  return api.get<RespuestaPaginada<Cliente>>(`/clientes?pagina=${pagina}&limite=${limite}`);
}

export function listarClientesSelector() {
  return api.get<ClienteSelector[]>('/clientes/selector');
}

export function crearCliente(data: ClienteInput) {
    return api.post<Cliente>('/clientes', data);
}

export function actualizarCliente(id: string, data: Partial<ClienteInput>) {
    return api.patch<Cliente>(`/clientes/${id}`, data);
}

export function eliminarCliente(id: string) {
    return api.delete<Cliente>(`/clientes/${id}`);
}
