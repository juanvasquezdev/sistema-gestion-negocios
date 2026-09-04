import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegistrarNegocioDto } from './dto/registrar-negocio.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuarioActual } from './usuario-actual.decorator';
import type { UsuarioAutenticado } from './usuario-actual.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registrar-negocio')
  async registrarNegocio(
    @Body() dto: RegistrarNegocioDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.authService.registrarNegocio(dto);

    res.cookie('token', resultado.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 2 * 60 * 60 * 1000,
    });

    return resultado;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.authService.login(dto);

    res.cookie('token', resultado.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 2 * 60 * 60 * 1000, // 2 horas, igual que la expiración de tu JWT
    });

    return resultado;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return { message: 'Sesión cerrada' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
