import { IsOptional, IsString } from 'class-validator';

export class FilterHistoryDto {
  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsString()
  value?: string;
}
