import { IsBoolean, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class StatusRepairOrderstDto {
  @IsMongoId()
  id: Types.ObjectId;

  @IsBoolean()
  approved: boolean;

  @IsBoolean()
  inTheWorkshop: boolean;

  @IsBoolean()
  piecesToWork?: boolean;
}
