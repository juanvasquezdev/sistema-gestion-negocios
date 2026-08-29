import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoVenta } from '@prisma/client';

class DetalleVentaItemDto {
  @IsUUID()
  productoId!: string;

  @IsNumber()
  @Min(0.001)
  cantidad!: number;
}

export class CreateVentaDto {
  @IsUUID()
  clienteId!: string;

  @IsOptional()
  @IsEnum(EstadoVenta)
  estado?: EstadoVenta;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaItemDto)
  detalles!: DetalleVentaItemDto[];
}
