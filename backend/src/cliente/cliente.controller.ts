import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clientes')
export class ClienteController {
  constructor(private clienteService: ClienteService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CreateClienteDto) {
    return this.clienteService.crear(usuario.negocioId, dto);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.clienteService.listar(usuario.negocioId);
  }

  @Get(':id')
  buscarUno(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.clienteService.buscarUno(usuario.negocioId, id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clienteService.actualizar(usuario.negocioId, id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  eliminar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.clienteService.eliminar(usuario.negocioId, id);
  }
}
