import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  Length,
} from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  vehicleMake: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsString()
  color: string;

  @IsString()
  colorType: string;

  @IsOptional()
  @IsString()
  chassis?: string;

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
