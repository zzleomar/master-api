import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phonePrefix?: string;

  @IsOptional()
  @IsNumber()
  @MaxLength(8)
  phone?: number;

  @IsOptional()
  @IsString()
  cellPrefix?: string;

  @IsOptional()
  @IsNumber()
  @MaxLength(8)
  cell?: number;

  @IsOptional()
  @IsMongoId()
  workshop?: string;
}
