import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { TypeSupplement } from '../entities/budget.entity';

export class CreateSupplementBudgetDto {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  budgetId: string;

  @IsEnum(TypeSupplement)
  @IsString()
  typeSupplement: string;
}
