import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

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
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extraerDesdeCookieOHeader,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      negocioId: payload.negocioId,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
