import { IsString, IsOptional, IsNotEmpty, IsEnum, IsNumber, Min, IsUUID } from 'class-validator';
import { UnidadMedida } from '@prisma/client';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsUUID()
  categoriaId!: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsEnum(UnidadMedida)
  unidadMedida!: UnidadMedida;

  @IsNumber()
  @Min(0)
  precioVenta!: number;

  // Stock inicial al crear el producto (crea el Inventario junto con el Producto)
  @IsNumber()
  @Min(0)
  stockInicial!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimo?: number;
}
