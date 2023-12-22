import { IsOptional, IsString } from 'class-validator';

export class FilterGetAllDto {
  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsString()
  value?: string;
}
