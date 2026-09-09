

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
