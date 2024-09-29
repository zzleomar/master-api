import { PartialType } from '@nestjs/swagger';
import { User } from './user.entity';

export class UserPayload extends PartialType(User) {
  createdA?: string;
  updateAt?: string;
  password?: string;
  _id?: any;
}
