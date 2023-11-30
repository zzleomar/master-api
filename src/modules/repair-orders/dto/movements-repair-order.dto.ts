import { IsArray } from 'class-validator';

export class MovementsRepairOrderDto {
  @IsArray()
  movements: any[];
}
