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

  @IsNotEmpty()
  @IsString()
  year: string;

  @IsString()
  color: string;

  @IsString()
  colorType: string;

  @IsOptional()
  @IsString()
  @Length(17)
  chassis?: string;

  @IsString()
  @Length(5, 6)
  plate: string;

  @IsOptional()
  @IsNumber()
  mileage?: number;

  @IsMongoId() // Debe ser un ID válido de MongoDB
  workshop: string;

  @IsMongoId() // Debe ser un ID válido de MongoDB
  owner: string;
}
