import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsNumber,
  MaxLength,
  Length,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { StatusBudget, TypeBudget } from '../entities/budget.entity';

export class CreateBudgetDto {
  @IsOptional()
  @IsString()
  vehicle?: string;

  @IsString()
  @IsMongoId()
  workshop?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsString()
  @Length(1, 12)
  claimNumber?: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  insuranceCompany: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  adjuster?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  adjusterEmail?: string;

  @IsOptional()
  @IsString()
  adjusterCellPrefix?: string;

  @IsOptional()
  @IsNumber()
  @MaxLength(8)
  adjusterCell?: number;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  quoter: string;

  @IsEnum(StatusBudget)
  @IsOptional()
  @IsString()
  status?: string;

  @IsEnum(TypeBudget)
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  code?: number;
}
