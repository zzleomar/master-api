import {
  BadRequestException,
  Body,
  Request,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FilterReportsDto } from './dto/filter-reports.dto';
import { Admin, Cotizador, Master, Recepcion } from '../auth/utils/decorator';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Recepcion()
  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/orders')
  reportOrders(@Request() request, @Body() filter: FilterReportsDto) {
    try {
      // const user = request['user'];
      return this.reportsService.reportOrders(filter);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Recepcion()
  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/statusWorkshop')
  statusWorkshop(@Request() request) {
    try {
      // const user = request['user'];
      return this.reportsService.statusWorkshop();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
} 
