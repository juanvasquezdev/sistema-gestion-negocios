import { IsNumber, Min } from 'class-validator';

export class RegistrarAbonoDto {
  @IsNumber()
  @Min(0.01)
  monto!: number;
}
