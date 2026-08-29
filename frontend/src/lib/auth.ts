import { api } from './api';

export interface Usuario {
  id: string;
  email: string;
  rol: string;
  negocioId: string;
}

export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password });
}

export function obtenerPerfil() {
  return api.get<Usuario>('/auth/perfil');
}