import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
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

  @Post('/list')
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
            $or: [{ make: { $regex: filters.value, $options: 'i' } }],
          },
          page,
          pageSize,
        );
      } else {
        return this.makesModelsService.search(
          {
            make: { $regex: filters.value, $options: 'i' },
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
    const filtro: any = filters;

    if (!filtro.filter || filtro.filter === 'all') {
      return this.makesModelsService.searchModels({}, page, pageSize);
    } else {
      return this.makesModelsService.searchModels(
        {
          $or: [
            { make: { $regex: filters.value, $options: 'i' } },
            { 'models.model': { $regex: filters.value, $options: 'i' } },
          ],
        },
        page,
        pageSize,
      );
    }
  }

  @Patch('/models/:id')
  async updateModels(@Param('id') id: string, @Body() updateModelDto: any) {
    try {
      const makeData2 = await this.makesModelsService.findOne(
        updateModelDto.make._id,
      );
      if (makeData2) {
        const index2: number = makeData2.models.findIndex(
          (item: any) => item._id == id,
        );

        if (index2 >= 0) {
          makeData2.models[index2] = {
            model: updateModelDto.model ?? '',
            status: updateModelDto.status ?? false,
            year: '',
            paint: '',
          };
        } else {
          makeData2.models.push({
            model: updateModelDto.model ?? '',
            status: updateModelDto.status ?? false,
            year: '',
            paint: '',
          });
        }
      }

      /* ----------------------------------- */

      const makeData = await this.makesModelsService.findOne(
        updateModelDto.makeId,
      );
      if (makeData) {
        const index: number = makeData.models.findIndex(
          (item: any) => item._id == id,
        );

        if (index >= 0) {
          makeData.models.splice(index, 1);
        }
      }

      /* ----------------------------------- */

      await this.makesModelsService.update(updateModelDto.makeId, makeData);

      return this.makesModelsService.update(updateModelDto.make._id, makeData2);
    } catch (error) {
      console.log('error: ', error);
      throw new BadRequestException(`Error inesperado`);
    }
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
