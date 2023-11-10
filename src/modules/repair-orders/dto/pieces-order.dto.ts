import { IsArray, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { PiecesItem } from '../entities/repair-order.entity';

export class PiecesOrderDto {
  @IsMongoId()
  id: Types.ObjectId;

  @IsArray()
  pieces: PiecesItem[];
}
