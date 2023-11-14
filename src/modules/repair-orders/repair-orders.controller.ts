import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FilterOrderDto } from './dto/filter-order.dto';
import { RepairOrdersService } from './repair-orders.service';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { BudgetsService } from '../budgets/budgets.service';
import {
  Admin,
  Cotizador,
  Master,
  Recepcion,
  Repuesto,
} from '../auth/utils/decorator';
import { Types } from 'mongoose';
import { AuthGuard } from '../auth/auth.guard';
import { StatusRepairOrderstDto } from './dto/status-order.dto';
import { HistoriesService } from '../histories/histories.service';
import { StatusBudget } from '../budgets/entities/budget.entity';
import mongoose from 'mongoose';
import { PiecesOrderDto } from './dto/pieces-order.dto';
import { InitOTDto } from './dto/init-OT-order.dto';

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

  @Master()
  @UseGuards(AuthGuard)
  @Post('/anulate')
  async anulate(
    @Request() request,
    @Body() data: { id: string; comment: string },
  ) {
    const user = request['user'];
    const dataOrders = await this.repairOrdersService.findBy({
      _id: data.id,
    });

    const dataOrder = dataOrders[0];

    if (dataOrder) {
      const anulatedOrder = await this.repairOrdersService.anulateOrder(data);

      await this.historiesService.createHistory({
        message: `Actualización de estados de las piezas de la orden ${anulatedOrder.code
          .toString()
          .padStart(6, '0')}`,
        user: user._id,
        ro: anulatedOrder.id,
      });

      return anulatedOrder;
    }
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
      workshop: new Types.ObjectId(user.workshop),
      _id: new Types.ObjectId(data.id),
    });
    if (ROData.length > 0) {
      const ROUpdate = await this.repairOrdersService.changeStatus(
        ROData[0],
        data,
        user,
      );
      if (ROUpdate) {
        await this.historiesService.createHistory({
          message: `Cambio de estado del vehiculo de la RO ${ROUpdate.code
            .toString()
            .padStart(6, '0')} a ${ROUpdate.statusVehicle}`,
          user: user._id,
          ro: ROUpdate.id,
        });
        return ROUpdate;
      } else {
        return new BadRequestException('No es posible cambiar estado');
      }
    } else {
      return new NotFoundException('RO no encontrado');
    }
  }

  @Master()
  @Cotizador()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/list')
  findAll(@Request() request, @Body() filters: FilterOrderDto) {
    const filtro: any = filters;
    const user = request['user'];

    if (!filtro.filter || filtro.filter === 'all') {
      return this.repairOrdersService.findAll({
        workshop: new mongoose.Types.ObjectId(user.workshop),
      });
    } else if (filtro.value) {
      if (
        [
          'vehicle',
          'insuranceCompany',
          'client',
          'plate',
          'code',
          'id',
        ].includes(filtro.filter)
      ) {
        let filterField = 'vehicleData.plate';

        switch (filtro.filter) {
          case 'insuranceCompany':
            filterField = 'budgetData.insuranceCompany.name';
            break;
          case 'client':
            filterField = 'budgetData.clientData.fullName';
            break;
          case 'vehicle':
            filterField = 'budgetData.vehicleData.plate';
            break;
          case 'code':
            filterField = 'code';
            filtro.value = parseInt(filtro.value);
            break;
          case 'id':
            filterField = '_id';
            filtro.value = new mongoose.Types.ObjectId(filtro.value);
            break;
          default:
            filterField = 'budgetData.vehicleData.plate';
            break;
        }

        return this.repairOrdersService.findOrderByFilter(
          { workshop: new mongoose.Types.ObjectId(user.workshop) },
          { ...filtro, label: filterField },
        );
      }
    } else {
      return new BadRequestException('value requerid');
    }
  }

  @Repuesto()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/pieces')
  async pieces(@Request() request, @Body() data: PiecesOrderDto) {
    const user = request['user'];
    const orderData = await this.repairOrdersService.findBy({
      workshop: new Types.ObjectId(user.workshop),
      _id: new Types.ObjectId(data.id),
    });
    const orderUpdate = await this.repairOrdersService.savePieces(
      orderData[0],
      data,
    );
    await this.historiesService.createHistory({
      message: `Actualización de estados de las piezas de la orden ${orderUpdate.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      ro: orderUpdate.id,
    });
    return orderUpdate;
  }

  @Master()
  @Admin()
  @Cotizador()
  @Recepcion()
  @UseGuards(AuthGuard)
  @Post('/initOT')
  async initOT(@Request() request, @Body() data: InitOTDto) {
    const user = request['user'];
    const orderData = await this.repairOrdersService.findBy({
      workshop: new Types.ObjectId(user.workshop),
      _id: new Types.ObjectId(data.id),
    });
    const orderUpdate = await this.repairOrdersService.generateOT(
      orderData[0],
      data,
    );
    await this.historiesService.createHistory({
      message: `Genero la OT de la orden ${orderUpdate.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      ro: orderUpdate.id,
    });
    return orderUpdate;
  }
}
