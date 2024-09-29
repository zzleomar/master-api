import { PartialType } from '@nestjs/swagger';
import { RepairOrderModel } from './repair-order.model.entity';

export class RepairOrder extends PartialType(RepairOrderModel) {
  _id?: any;
}
