import { api } from './api';

export interface Proveedor {
  id: string;
  negocioId: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface ProveedorInput {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export function listarProveedores() {
  return api.get<Proveedor[]>('/proveedores');
}

export function crearProveedor(data: ProveedorInput) {
  return api.post<Proveedor>('/proveedores', data);
}

export function actualizarProveedor(id: string, data: Partial<ProveedorInput>) {
  return api.patch<Proveedor>(`/proveedores/${id}`, data);
}

export function eliminarProveedor(id: string) {
  return api.delete<Proveedor>(`/proveedores/${id}`);
}