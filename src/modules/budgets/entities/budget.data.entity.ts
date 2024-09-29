import { PartialType } from '@nestjs/swagger';
import { BudgetModel } from './budget.model.entity';

export class Budget extends PartialType(BudgetModel) {
  _id?: any;
}
