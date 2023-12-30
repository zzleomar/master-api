import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { UpdateInsuranceDto } from './dto/update-insurance.dto';
import { Master } from '../auth/utils/decorator';
import { AuthGuard } from '../auth/auth.guard';
import { FilterGetAllDto } from '../budgets/dto/filter-bugget.dto';

@Controller('insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  @Master()
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createInsuranceDto: CreateInsuranceDto) {
    return this.insurancesService.create(createInsuranceDto);
  }

  @Get()
  findAll() {
    return this.insurancesService.findAll();
  }

  @Master()
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInsuranceDto: UpdateInsuranceDto,
  ) {
    return this.insurancesService.update(id, updateInsuranceDto);
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
      return this.insurancesService.findAll({}, page, pageSize);
    } else {
      if (filtro.filter === 'name') {
        return this.insurancesService.findAll(
          {
            $or: [{ name: { $regex: filters.value, $options: 'i' } }],
          },
          page,
          pageSize,
        );
      } else {
        return this.insurancesService.findAll(
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
}
