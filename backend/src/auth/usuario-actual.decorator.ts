import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioAutenticado {
  userId: string;
  negocioId: string;
  email: string;
  rol: string;
}

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx
    .switchToHttp().getRequest<{ user: UsuarioAutenticado }>();
    return request.user;
  },
);
