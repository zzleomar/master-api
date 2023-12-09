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
      const user = request['user'];
      return this.reportsService.reportOrders(filter, user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Recepcion()
  @Master()
  @Admin()
  @Cotizador()
  @UseGuards(AuthGuard)
  @Post('/statusWorkshop')
  statusWorkshop(@Request() request) {
    try {
      const user = request['user'];
      return this.reportsService.statusWorkshop(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Recepcion()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/insurances')
  insuranceReport(@Body() filter: FilterReportsDto) {
    try {
      return this.reportsService.insuranceReport(filter);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Recepcion()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/quoters')
  quotersReport(@Body() filter: FilterReportsDto) {
    try {
      return this.reportsService.quotersReport(filter);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Master()
  @Admin()
  @Cotizador()
  @UseGuards(AuthGuard)
  @Post('/quotersStatus')
  quotersOrderSatusReport(
    @Request() request,
    @Body() filter: FilterReportsDto,
  ) {
    try {
      const user = request['user'];
      return this.reportsService.quotersOrderSatusReport(filter, user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
