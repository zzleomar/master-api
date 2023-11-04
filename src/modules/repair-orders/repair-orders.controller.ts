import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { RepairOrdersService } from './repair-orders.service';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { BudgetsService } from '../budgets/budgets.service';
import { Admin, Cotizador, Master, Recepcion } from '../auth/utils/decorator';
import { AuthGuard } from '../auth/auth.guard';

@Controller('repairOrders')
export class RepairOrdersController {
  constructor(
    private readonly repairOrdersService: RepairOrdersService,
    private readonly budgetsService: BudgetsService,
  ) {}

  @Recepcion()
  @Master()
  @Cotizador()
  @Admin()
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Request() request,
    @Body() createRepairOrderDto: CreateRepairOrderDto,
  ) {
    const user = request['user'];
    if (createRepairOrderDto.approved || createRepairOrderDto.inTheWorkshop) {
      createRepairOrderDto.workshop = user.workshop;
      const dataBudgets = await this.budgetsService.findBy({
        _id: createRepairOrderDto.budgetId,
      });
      const order = await this.repairOrdersService.findBy(
        {
          budget: createRepairOrderDto.budgetId,
        },
        false,
      );
      if (
        dataBudgets[0].status === 'Espera' &&
        dataBudgets[0].type === 'Principal' &&
        !order
      ) {
        return this.repairOrdersService.create(
          createRepairOrderDto,
          dataBudgets[0],
          user,
        );
      }
      if (order && dataBudgets[0].type === 'Principal') {
        return new BadRequestException('Presupuesto ya posee una RO');
      }

      //TODO falta definir que hacer con las RO de los presupuestos tipo Suplemento
    }
    return new BadRequestException('No es posible crear la RO');
  }

  @Recepcion()
  @Master()
  @Cotizador()
  @Admin()
  @UseGuards(AuthGuard)
  @Post()
  @Get()
  findAll(@Request() request) {
    const user = request['user'];
    return this.budgetsService.findAll({ workshop: user.workshop });
  }
}
