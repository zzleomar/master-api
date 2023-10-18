import {
  IsString,
  IsOptional,
  IsNumber,
  IsMongoId,
  Length,
} from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  vehicleMake: string;

  @IsOptional()
  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  year: number;

  @IsOptional()
  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  colorType: string;

  @IsOptional()
  @IsString()
  @Length(17)
  chassis?: string;

  @IsOptional()
  @IsString()
  @Length(5, 6)
  plate: string;

  @IsOptional()
  @IsNumber()
  mileage?: number;

  @IsOptional()
  @IsMongoId() // Debe ser un ID válido de MongoDB
  workshop?: string;

  @IsOptional()
  @IsMongoId() // Debe ser un ID válido de MongoDB
  owner?: string;
}
