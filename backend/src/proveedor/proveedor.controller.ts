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
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@UseGuards(JwtAuthGuard)
@Controller('proveedores')
export class ProveedorController {
  constructor(private proveedorService: ProveedorService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CreateProveedorDto) {
    return this.proveedorService.crear(usuario.negocioId, dto);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.proveedorService.listar(usuario.negocioId);
  }

  @Get(':id')
  buscarUno(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.proveedorService.buscarUno(usuario.negocioId, id);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.proveedorService.actualizar(usuario.negocioId, id, dto);
  }

  @Delete(':id')
  eliminar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.proveedorService.eliminar(usuario.negocioId, id);
  }
}
