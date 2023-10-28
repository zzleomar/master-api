import { IsMongoId, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { StatusBudget } from '../entities/budget.entity';

export class StatusBudgetDto {
  @IsMongoId()
  id: Types.ObjectId;

  @IsString()
  status: StatusBudget;
}
