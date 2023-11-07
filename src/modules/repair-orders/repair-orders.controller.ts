import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RepairOrdersService } from './repair-orders.service';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { BudgetsService } from '../budgets/budgets.service';
import { Admin, Cotizador, Master, Recepcion } from '../auth/utils/decorator';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/auth.guard';
import { StatusRepairOrderstDto } from './dto/status-budget.dto';
import { HistoriesService } from '../histories/histories.service';
import { StatusBudget } from '../budgets/entities/budget.entity';

@Controller('repairOrders')
export class RepairOrdersController {
  constructor(
    private readonly repairOrdersService: RepairOrdersService,
    private readonly historiesService: HistoriesService,
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
          budget: new Types.ObjectId(createRepairOrderDto.budgetId),
        },
        false,
      );
      if (
        dataBudgets[0].status == StatusBudget.Espera &&
        dataBudgets[0].type === 'Principal' &&
        order.length === 0
      ) {
        return this.repairOrdersService.create(
          createRepairOrderDto,
          dataBudgets[0],
          user,
        );
      }
      if (order.length > 0 && dataBudgets[0].type === 'Principal') {
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

  @Recepcion()
  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/status')
  async status(@Request() request, @Body() data: StatusRepairOrderstDto) {
    const user = request['user'];
    const ROData = await this.repairOrdersService.findBy({
      workshop: user.workshop,
      _id: data.id,
    });
    if (ROData.length > 0) {
      const ROUpdate = await this.repairOrdersService.changeStatus(
        ROData[0],
        data,
      );
      await this.historiesService.createHistory({
        message: `Cambio de estado del vehiculo de la RO ${ROUpdate.code
          .toString()
          .padStart(6, '0')} a ${ROUpdate.statusVehicle}`,
        user: user._id,
        ro: ROUpdate.id,
      });
      return ROUpdate;
    } else {
      return new NotFoundException('RO no encontrado');
    }
  }
}
