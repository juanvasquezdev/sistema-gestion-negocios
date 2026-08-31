import { api } from './api';
import type { Categoria } from './categorias';
import type { Proveedor } from './proveedores';

export type UnidadMedida = 'UNIDAD' | 'GRAMO';

export interface Inventario {
  id: string;
  stockActual: string;
  stockMinimo: string | null;
}

export interface Producto {
  id: string;
  negocioId: string;
  categoriaId: string;
  proveedorId: string | null;
  nombre: string;
  unidadMedida: UnidadMedida;
  precioVenta: string;
  activo: boolean;
  inventario: Inventario | null;
  categoria: Categoria;
  proveedor: Proveedor | null;
}

// El backend distingue estos dos: stockInicial solo existe al crear
export interface ProductoCreateInput {
  nombre: string;
  categoriaId: string;
  proveedorId?: string;
  unidadMedida: UnidadMedida;
  precioVenta: number;
  stockInicial: number;
  stockMinimo?: number;
}

export interface ProductoUpdateInput {
  nombre?: string;
  categoriaId?: string;
  proveedorId?: string;
  unidadMedida?: UnidadMedida;
  precioVenta?: number;
  stockMinimo?: number;
}

export function listarProductos() {
  return api.get<Producto[]>('/productos');
}

export function crearProducto(data: ProductoCreateInput) {
  return api.post<Producto>('/productos', data);
}

export function actualizarProducto(id: string, data: ProductoUpdateInput) {
  return api.patch<Producto>(`/productos/${id}`, data);
}

export function eliminarProducto(id: string) {
  return api.delete<Producto>(`/productos/${id}`);
}