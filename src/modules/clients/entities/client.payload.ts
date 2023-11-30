import { PartialType } from '@nestjs/swagger';
import { Client } from './client.entity';

export class ClientPayload extends PartialType(Client) {
  createdAt?: string;
  updateAt?: string;
}
