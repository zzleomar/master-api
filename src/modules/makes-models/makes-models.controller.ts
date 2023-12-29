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
import { FilterGetAllDto } from '../budgets/dto/filter-bugget.dto';

@Controller('makesModels')
export class MakesModelsController {
  constructor(private readonly makesModelsService: MakesModelsService) {}

  @Post()
  create(@Body() createMakesModelDto: CreateMakesModelDto) {
    return this.makesModelsService.create(createMakesModelDto);
  }

  @Post('/makes/list')
  findFilterMakes(
    @Body() filters: FilterGetAllDto,
    @Body('page') page: number = 0,
    @Body('pageSize') pageSize: number = 30,
  ) {
    const filtro: any = filters;
    if (!filtro.filter || filtro.filter === 'all') {
      return this.makesModelsService.search({}, page, pageSize);
    } else {
      if (filtro.filter === 'name') {
        return this.makesModelsService.search(
          {
            $or: [{ name: { $regex: filters.value, $options: 'i' } }],
          },
          page,
          pageSize,
        );
      } else {
        return this.makesModelsService.search(
          {
            name: { $regex: filters.value, $options: 'i' },
            side: { $regex: filters.filter, $options: 'i' },
          },
          page,
          pageSize,
        );
      }
    }
  }

  @Post('/models/list')
  findFilterModels(
    @Body() filters: FilterGetAllDto,
    @Body('page') page: number = 0,
    @Body('pageSize') pageSize: number = 30,
  ) {
    return this.makesModelsService.findAll();
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
