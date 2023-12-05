import { IsOptional, IsString } from 'class-validator';

export class FilterReportsDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  initDate?: string; // DD/MM/YYYY HH:mm:ss

  @IsOptional()
  @IsString()
  endDate?: string; // DD/MM/YYYY HH:mm:ss
}
