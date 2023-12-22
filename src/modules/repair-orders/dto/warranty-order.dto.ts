import { IsString } from 'class-validator';

export class WarrantyOrderDto {
  @IsString()
  id: string;

  @IsString()
  endDate: string; // DD/MM/YYY

  @IsString()
  commentWarranty: string;

  @IsString()
  mode: string;
}
