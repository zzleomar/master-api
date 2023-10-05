import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateWorkshopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsOptional() // El workshop es opcional para los SuperAdmin
  @IsMongoId()
  owner: string; // Debe ser el ID del usuario propietario (MongoDB ObjectId)
}
