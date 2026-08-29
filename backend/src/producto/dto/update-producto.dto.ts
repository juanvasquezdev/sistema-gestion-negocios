import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';

// Excluimos stockInicial: el stock NO se actualiza por aquí,
// eso será responsabilidad del módulo Inventario (ajustes de stock son un flujo aparte)
export class UpdateProductoDto extends PartialType(
  OmitType(CreateProductoDto, ['stockInicial'] as const),
) {}
