import { PartialType } from '@nestjs/swagger';
import { CreateBudgetDto } from './create-budget.dto';
import { IsOptional } from 'class-validator';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @IsOptional()
  editOwner?: boolean;

  @IsOptional()
  id?: boolean;
}
