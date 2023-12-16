import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateHistoryDto {
  @IsNotEmpty()
  @IsMongoId() // Valida que sea un ID de Mongo válido (por ejemplo, un ID de usuario)
  user: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsMongoId() // Valida que sea un ID de Mongo válido (por ejemplo, un ID de presupuesto)
  budget?: string;

  @IsOptional()
  ro?: string;

  @IsOptional()
  @IsMongoId() // Valida que sea un ID de Mongo válido (por ejemplo, un ID de presupuesto)
  vehicle?: string;

  @IsOptional()
  @IsMongoId() // Valida que sea un ID de Mongo válido (por ejemplo, un ID de presupuesto)
  client?: string;
}
