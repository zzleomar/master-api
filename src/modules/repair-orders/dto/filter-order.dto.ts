import { IsOptional, IsString } from 'class-validator';

export class FilterOrderDto {
  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsString()
  value?: string;
}
