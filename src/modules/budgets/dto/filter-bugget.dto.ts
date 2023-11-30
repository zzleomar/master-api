import { IsOptional, IsString } from 'class-validator';

export class FilterBudgetDto {
  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsString()
  value?: string;
}
