import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
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
  phone?: number;

  @IsOptional()
  @IsString()
  cellPrefix?: string;

  @IsOptional()
  @IsNumber()
  cell?: number;

  @IsOptional()
  @IsMongoId()
  workshop?: string;

  @IsOptional()
  oldId?: number;
}
