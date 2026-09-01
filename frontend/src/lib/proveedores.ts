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

export interface RespuestaPaginada<T> {
  data: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ProveedorSelector {
  id: string;
  nombre: string;
}

export function listarProveedores(pagina = 1, limite = 20) {
  return api.get<RespuestaPaginada<Proveedor>>(
    `/proveedores?pagina=${pagina}&limite=${limite}`
  );
}

export function listarProveedoresSelector() {
  return api.get<ProveedorSelector[]>('/proveedores/selector');
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