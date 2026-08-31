// backend/src/categoria/categoria.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-actual.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  crear(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Body() dto: CrearCategoriaDto,
  ) {
    return this.categoriaService.crear(usuario.negocioId, dto);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.categoriaService.listar(usuario.negocioId);
  }

  @Get(':id')
  buscarUno(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ) {
    return this.categoriaService.buscarUno(usuario.negocioId, id);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: ActualizarCategoriaDto,
  ) {
    return this.categoriaService.actualizar(usuario.negocioId, id, dto);
  }

  @Delete(':id')
  eliminar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ) {
    return this.categoriaService.eliminar(usuario.negocioId, id);
  }
}
