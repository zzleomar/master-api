import { IsMongoId, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class InitOTDto {
  @IsMongoId()
  id: Types.ObjectId;

  @IsString()
  endDate: string; // DD/MM/YYY
}
