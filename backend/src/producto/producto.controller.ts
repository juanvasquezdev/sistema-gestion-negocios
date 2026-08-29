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

@UseGuards(JwtAuthGuard)
@Controller('productos')
export class ProductoController {
  constructor(private productoService: ProductoService) {}

  @Post()
  crear(@UsuarioActual() usuario: UsuarioAutenticado, @Body() dto: CreateProductoDto) {
    return this.productoService.crear(usuario.negocioId, dto);
  }

  @Get()
  listar(@UsuarioActual() usuario: UsuarioAutenticado) {
    return this.productoService.listar(usuario.negocioId);
  }

  @Get(':id')
  buscarUno(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.productoService.buscarUno(usuario.negocioId, id);
  }

  @Patch(':id')
  actualizar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productoService.actualizar(usuario.negocioId, id, dto);
  }

  @Delete(':id')
  eliminar(@UsuarioActual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.productoService.eliminar(usuario.negocioId, id);
  }
}
