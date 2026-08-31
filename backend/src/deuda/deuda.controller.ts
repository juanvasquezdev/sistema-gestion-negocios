import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';
import { DeudaService } from './deuda.service';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';
import { Query } from '@nestjs/common';
import { PaginacionDto } from '../common/dto/paginacion.dto';
@UseGuards(JwtAuthGuard)
@Controller('deudas')
export class DeudaController {
  constructor(private deudaService: DeudaService) {}

  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Query() paginacion: PaginacionDto,
  ) {
    return this.deudaService.listar(usuario.negocioId, paginacion);
  }
  @Get(':id')
  buscarUno(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.deudaService.buscarUno(usuario.negocioId, id);
  }

  @Patch(':id/abono')
  registrarAbono(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: RegistrarAbonoDto,
  ) {
    return this.deudaService.registrarAbono(usuario.negocioId, id, dto);
  }
}
