import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateRepairOrderDto {
  @IsMongoId()
  budgetId: Types.ObjectId;

  @IsBoolean()
  approved: boolean;

  @IsBoolean()
  inTheWorkshop: boolean;

  @IsOptional()
  @IsString()
  @IsMongoId()
  workshop?: Types.ObjectId;

  @IsOptional()
  oldCode?: number;
}
