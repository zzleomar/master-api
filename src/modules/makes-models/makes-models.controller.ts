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
import { FilterGetAllDto } from '../budgets/dto/filter-bugget.dto';

@Controller('makesModels')
export class MakesModelsController {
  constructor(private readonly makesModelsService: MakesModelsService) {}

  @Post()
  async create(@Body() createMakesModelDto: any) {
    const data = await this.makesModelsService.find(
      createMakesModelDto.make,
      'make',
    );
    if (!data || !data.length) {
      return this.makesModelsService.create(createMakesModelDto);
    } else {
      console.log('error: La marca ya esta registrada en el sistema');
      throw new BadRequestException(
        `La marca ya esta registrada en el sistema`,
      );
    }
  }

  @Post('/model')
  async createModel(@Body() createMakesModelDto: any) {
    const data = await this.makesModelsService.find(
      createMakesModelDto.model,
      'models.model',
    );
    if (!data || !data.length) {
      try {
        const makeData2 = await this.makesModelsService.findOne(
          createMakesModelDto.make._id,
        );

        if (makeData2) {
          if (!makeData2.status) {
            makeData2.status = true;
          }

          makeData2.models.push({
            model: createMakesModelDto.model ?? '',
            status:
              createMakesModelDto.status !== undefined &&
              createMakesModelDto.status !== null
                ? createMakesModelDto.status
                : true,
            year: '',
            paint: '',
          });

          return this.makesModelsService.update(
            createMakesModelDto.make._id,
            makeData2,
          );
        }
      } catch (error) {
        console.log('error: ', error);
        throw new BadRequestException(`Error inesperado`);
      }
    } else {
      console.log('error: El modelo ya esta registrado en el sistema');
      throw new BadRequestException(
        `El modelo ya esta registrado en el sistema`,
      );
    }
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

        if (!makeData2.status && updateModelDto.status) {
          makeData2.status = true;
        }

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
    return this.makesModelsService.findAll(true);
  }

  @Get('/actives')
  findActives() {
    return this.makesModelsService.findAll(false);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.makesModelsService.findOne(id);
  }

  @Get('/make/:make')
  async existMake(@Param('make') make: string) {
    const data = await this.makesModelsService.find(make, 'make');
    return !data.length ? true : false;
  }

  @Get('/model/:model')
  async existModel(@Param('model') model: string) {
    const data = await this.makesModelsService.find(model, 'models.model');
    return !data.length ? true : false;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMakesModelDto: any) {
    const makeData = await this.makesModelsService.findOne(id);
    if (makeData) {
      if (updateMakesModelDto.make && updateMakesModelDto.make !== '') {
        makeData.make = updateMakesModelDto.make;
      }

      if (
        updateMakesModelDto.status !== undefined &&
        updateMakesModelDto.status !== null
      ) {
        makeData.status = updateMakesModelDto.status;

        for (let index = 0; index < makeData.models.length; index++) {
          makeData.models[index].status = updateMakesModelDto.status;
        }
      }

      if (updateMakesModelDto.models) {
        makeData.models = updateMakesModelDto.models;
      }

      return await this.makesModelsService.update(id, makeData);
    } else {
      throw new BadRequestException(`Error inesperado`);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.makesModelsService.remove(id);
  }
}
