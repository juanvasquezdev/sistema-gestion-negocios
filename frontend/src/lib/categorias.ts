import { api } from './api';

export interface Categoria {
  id: string;
  negocioId: string;
  nombre: string;
  descripcion?: string | null;
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string;
}

export function listarCategorias() {
  return api.get<Categoria[]>('/categoria');
}

export function crearCategoria(data: CategoriaInput) {
  return api.post<Categoria>('/categoria', data);
}