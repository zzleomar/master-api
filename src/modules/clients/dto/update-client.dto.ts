import {
  IsString,
  IsEmail,
  IsOptional,
  IsMongoId,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  fullName: string;

  @IsString()
  @IsOptional()
  documentType: string;

  @IsString()
  @IsOptional()
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
