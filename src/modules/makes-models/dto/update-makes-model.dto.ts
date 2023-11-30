import { PartialType } from '@nestjs/swagger';
import { CreateMakesModelDto } from './create-makes-model.dto';

export class UpdateMakesModelDto extends PartialType(CreateMakesModelDto) {}
