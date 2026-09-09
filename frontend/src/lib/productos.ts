import { api } from './api';
import type { Categoria } from './categorias';
import type { Proveedor } from './proveedores';
import type { RespuestaPaginada } from './paginacion';

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

export interface ProductoSelector {
  id: string;
  nombre: string;
  precioVenta: string;
  unidadMedida: UnidadMedida;
}

export function listarProductos(pagina = 1, limite = 20) {
  return api.get<RespuestaPaginada<Producto>>(
    `/productos?pagina=${pagina}&limite=${limite}`
  );
}

export function listarProductosSelector() {
  return api.get<ProductoSelector[]>('/productos/selector');
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
