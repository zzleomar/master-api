import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MakesModelsService } from './makes-models.service';
import { CreateMakesModelDto } from './dto/create-makes-model.dto';
import { UpdateMakesModelDto } from './dto/update-makes-model.dto';

@Controller('makes-models')
export class MakesModelsController {
  constructor(private readonly makesModelsService: MakesModelsService) {}

  @Post()
  create(@Body() createMakesModelDto: CreateMakesModelDto) {
    return this.makesModelsService.create(createMakesModelDto);
  }

  @Get()
  findAll() {
    return this.makesModelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.makesModelsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMakesModelDto: UpdateMakesModelDto,
  ) {
    return this.makesModelsService.update(id, updateMakesModelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.makesModelsService.remove(id);
  }
}
