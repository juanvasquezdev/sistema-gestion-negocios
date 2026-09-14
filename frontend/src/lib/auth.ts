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

// Respuesta de GET /auth/perfil: los datos del JWT (ojo: `userId`, no `id` como en login)
// más los nombres consultados en la DB.
export interface PerfilUsuario {
  userId: string;
  negocioId: string;
  email: string;
  rol: string;
  nombre: string;
  negocioNombre: string;
}

export function obtenerPerfil() {
  return api.get<PerfilUsuario>('/auth/perfil');
}
export interface RegistrarNegocioInput {
  nombreNegocio: string;
  nombreUsuario: string;
  email: string;
  password: string;
}

export function registrarNegocio(data: RegistrarNegocioInput) {
  return api.post<LoginResponse>('/auth/registrar-negocio', data);
}