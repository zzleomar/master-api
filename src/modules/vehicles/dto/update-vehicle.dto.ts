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
  vehicleModel: string;

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
  owner?: string;
}
