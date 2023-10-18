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

  @IsOptional()
  @IsString()
  @IsMongoId()
  workshop?: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  insuranceCompany: string;

  @IsOptional()
  @IsString()
  adjuster?: string;

  @IsOptional()
  @IsString()
  adjusterEmail?: string;

  @IsOptional()
  @IsString()
  adjusterCellPrefix?: string;

  @IsOptional()
  @IsNumber()
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
