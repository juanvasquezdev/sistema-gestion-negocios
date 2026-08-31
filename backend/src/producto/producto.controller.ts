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
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Query } from '@nestjs/common';
import { PaginacionDto } from '../common/dto/paginacion.dto';
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductoController {
  constructor(private productoService: ProductoService) {}

  @Roles('ADMIN')
  @Post()
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CreateProductoDto) {
    return this.productoService.crear(usuario.negocioId, dto);
  }

  @Get()
  listar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Query() paginacion: PaginacionDto,
  ) {
    return this.productoService.listar(usuario.negocioId, paginacion);
  }

  @Get(':id')
  buscarUno(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.productoService.buscarUno(usuario.negocioId, id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productoService.actualizar(usuario.negocioId, id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  eliminar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.productoService.eliminar(usuario.negocioId, id);
  }
}
