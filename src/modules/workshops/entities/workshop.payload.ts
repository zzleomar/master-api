import { PartialType } from '@nestjs/swagger';
import { Workshop } from './workshop.entity';

export class WorkshopPayload extends PartialType(Workshop) {
  createdA?: string;
  updateAt?: string;
}
