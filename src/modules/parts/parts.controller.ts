import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { AuthGuard } from '../auth/auth.guard';
import { FilterGetAllDto } from '../budgets/dto/filter-bugget.dto';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  create(@Body() createPartDto: CreatePartDto) {
    return this.partsService.create(createPartDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.partsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Post('/list')
  findAllPage(
    @Body() filters: FilterGetAllDto,
    @Body('page') page: number = 0,
    @Body('pageSize') pageSize: number = 30,
  ) {
    const filtro: any = filters;
    if (!filtro.filter || filtro.filter === 'all') {
      return this.partsService.findAll({}, page, pageSize);
    } else {
      //TODO falta retornar cuando se busca por nombre de piezas
      return this.partsService.findAll(
        {
          name: { $regex: filters.value, $options: 'i' },
        },
        page,
        pageSize,
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    return this.partsService.update(id, updatePartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partsService.remove(id);
  }
}
