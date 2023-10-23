import { PartialType } from '@nestjs/swagger';
import { Vehicle } from './vehicle.entity';

export class VehiclePayload extends PartialType(Vehicle) {
  createdA?: string;
  updateAt?: string;
}
