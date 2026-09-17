

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface ApiErrorBody {
  message?: string;
  [key: string]: unknown;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: ApiErrorBody,
  ) {
    super(data?.message ?? 'Error en la petición');
  }
}

// 401 que no significan "sesión expirada": credenciales incorrectas en el login, y endpoints
// de auth que no requieren sesión. Esos siguen lanzando ApiError para que la página muestre
// su mensaje.
const ENDPOINTS_SIN_SESION = ['/auth/login', '/auth/registrar-negocio', '/auth/logout'];

const RUTA_SESION_EXPIRADA = '/login?sesion=expirada';

// Evita varias redirecciones si fallan varias peticiones a la vez.
let redirigiendoAlLogin = false;

// Un 401 en plena sesión (token vencido, usuario desactivado; ver T4 en el backend) lleva al
// login. Primero se pide al backend que borre la cookie httpOnly, para no dejar el token viejo.
// Solo en el navegador: en el servidor no hay window y el error se lanza como siempre.
async function redirigirAlLogin() {
  if (redirigiendoAlLogin) return;
  redirigiendoAlLogin = true;
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // Si falla, igual se redirige: la cookie vieja ya no sirve para nada.
  }
  window.location.replace(RUTA_SESION_EXPIRADA);
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // clave: hace que el navegador envíe/reciba la cookie httpOnly
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    !ENDPOINTS_SIN_SESION.includes(endpoint)
  ) {
    void redirigirAlLogin();
    // La página se va a recargar en /login: la promesa queda pendiente a propósito, para que la
    // pantalla no muestre un error genérico justo antes de salir.
    return new Promise<T>(() => {});
  }

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) => apiFetch<T>(endpoint, { method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown) => apiFetch<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
