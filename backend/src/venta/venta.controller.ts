import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';

@UseGuards(JwtAuthGuard)
@Controller('ventas')
export class VentaController {
  constructor(private ventaService: VentaService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CreateVentaDto) {
    return this.ventaService.crear(usuario.negocioId, usuario.userId, dto);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.ventaService.listar(usuario.negocioId);
  }

  @Get(':id')
  buscarUno(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.ventaService.buscarUno(usuario.negocioId, id);
  }
}
