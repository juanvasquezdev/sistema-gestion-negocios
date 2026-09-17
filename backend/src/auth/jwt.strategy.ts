import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { UsuarioAutenticado } from './usuario-actual.decorator';

export interface JwtPayload {
  sub: string;
  negocioId: string;
  email: string;
  rol: string;
}

// Extractor personalizado: busca el token primero en la cookie 'token',
// y si no está ahí, cae de vuelta al header 'Authorization: Bearer' de siempre.
// Así Postman sigue funcionando igual que hasta ahora, y el frontend con
// cookies httpOnly también queda cubierto.
const extraerDesdeCookieOHeader = (req: Request): string | null => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token as string;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extraerDesdeCookieOHeader,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  // Corre en cada petición autenticada. El token solo identifica al usuario (sub + negocioId):
  // activo, rol y email salen de la base, así desactivar a un usuario o cambiarle el rol aplica
  // en la siguiente petición y no cuando vence el token (T4, backend/SECURITY-BACKLOG.md).
  // No es revocación real: si el usuario se reactiva, su token vuelve a funcionar hasta vencer.
  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: payload.sub,
        negocioId: payload.negocioId,
        activo: true,
        // Fase 3 del Superadmin: aquí va la condición de que el negocio no esté suspendido,
        // para que un negocio suspendido también bloquee a sus usuarios en esta misma consulta.
      },
      select: { id: true, negocioId: true, email: true, rol: { select: { nombre: true } } },
    });

    if (!usuario) {
      throw new UnauthorizedException('Sesión inválida.');
    }

    return {
      userId: usuario.id,
      negocioId: usuario.negocioId,
      email: usuario.email,
      rol: usuario.rol.nombre,
    };
  }
}
