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

export function listarClientes() {
    return api.get<Cliente[]>('/clientes');
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