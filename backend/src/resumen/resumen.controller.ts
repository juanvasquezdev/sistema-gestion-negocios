import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';
import { ResumenService } from './resumen.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resumen')
export class ResumenController {
  constructor(private resumenService: ResumenService) {}

  @Get()
  obtener(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.resumenService.obtenerResumen(usuario.negocioId);
  }
}
