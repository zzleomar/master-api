import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export class InspectionBudgetDto {
  @IsArray()
  pieces: object[];
  @IsArray()
  others: object[];
  @IsArray()
  photos: string[];
  @IsArray()
  documents: string[];

  @IsMongoId()
  budgetId: Types.ObjectId;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  tax?: number;
}
