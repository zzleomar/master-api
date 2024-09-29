import { PartialType } from '@nestjs/swagger';
import { InsuranceModel } from './insurance.entity';

export class Insurance extends PartialType(InsuranceModel) {
  _id?: any;
}
