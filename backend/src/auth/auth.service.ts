import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrarNegocioDto } from './dto/registrar-negocio.dto';
import { LoginDto } from './dto/login.dto';
import type { UsuarioAutenticado } from './usuario-actual.decorator';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrarNegocio(dto: RegistrarNegocioDto) {
    const emailExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (emailExistente) {
      throw new ConflictException('Ya existe un usuario con ese email.');
    }

    const rolAdmin = await this.prisma.rol.findUnique({
      where: { nombre: 'ADMIN' },
    });

    if (!rolAdmin) {
      throw new Error(
        'Rol ADMIN no encontrado. Ejecuta el seed antes de registrar negocios.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const negocio = await tx.negocio.create({
        data: { nombre: dto.nombreNegocio },
      });

      const usuario = await tx.usuario.create({
        data: {
          negocioId: negocio.id,
          rolId: rolAdmin.id,
          nombre: dto.nombreUsuario,
          email: dto.email,
          passwordHash,
        },
      });

      return { negocio, usuario };
    });

    return this.generarRespuestaAuth(
      resultado.usuario.id,
      resultado.negocio.id,
      resultado.usuario.email,
      rolAdmin.nombre,
    );
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValido = await bcrypt.compare(
      dto.password,
      usuario.passwordHash,
    );

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.generarRespuestaAuth(
      usuario.id,
      usuario.negocioId,
      usuario.email,
      usuario.rol.nombre,
    );
  }

  // Perfil del usuario autenticado. userId y negocioId salen del JWT (nunca del cliente).
  // Consulta la DB para traer los nombres y para bloquear usuarios desactivados
  // aunque su token todavía no haya vencido.
  async perfil(usuario: UsuarioAutenticado) {
    const encontrado = await this.prisma.usuario.findFirst({
      where: { id: usuario.userId, negocioId: usuario.negocioId },
      select: {
        nombre: true,
        activo: true,
        negocio: { select: { nombre: true } },
      },
    });

    if (!encontrado || !encontrado.activo) {
      throw new UnauthorizedException('Sesión inválida.');
    }

    return {
      ...usuario,
      nombre: encontrado.nombre,
      negocioNombre: encontrado.negocio.nombre,
    };
  }

  private async generarRespuestaAuth(
    usuarioId: string,
    negocioId: string,
    email: string,
    rol: string,
  ) {
    const payload = { sub: usuarioId, negocioId, email, rol };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: { id: usuarioId, email, rol, negocioId },
    };
  }
}
