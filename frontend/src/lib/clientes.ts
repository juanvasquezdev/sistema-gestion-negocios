import {api} from './api';

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

export interface RespuestaPaginada<T> {
  data: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export function listarClientes(pagina = 1, limite = 10) {
  return api.get<RespuestaPaginada<Cliente>>(`/clientes?pagina=${pagina}&limite=${limite}`);
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