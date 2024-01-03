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
import { MovementsRepairOrderDto } from './dto/movements-repair-order.dto';
import { map } from 'lodash';
import { StatusRepairOrder } from './entities/repair-order.entity';
import { codeRO } from './utils/parseLabel';
import { WarrantyOrderDto } from './dto/warranty-order.dto';

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

      if (dataBudgets[0].status == StatusBudget.Espera && order.length === 0) {
        return this.repairOrdersService.create(
          createRepairOrderDto,
          dataBudgets[0],
          user,
        );
      }

      if (order.length > 0) {
        return new BadRequestException('Presupuesto ya posee una RO');
      }
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
      const anulatedOrder = await this.repairOrdersService.changeStatusOrder(
        data,
        dataOrder,
        StatusRepairOrder.Anulada,
      );

      await this.historiesService.createHistory({
        message: `Anuló la RO ${codeRO(anulatedOrder)}`,
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

    const oldstatus: string = ROData[0].statusVehicle ?? '';

    if (ROData.length > 0) {
      const ROUpdate = await this.repairOrdersService.changeStatus(
        ROData[0],
        data,
        user,
      );

      if (ROUpdate) {
        await this.historiesService.createHistory({
          message: `Cambió estado RO ${codeRO(ROUpdate)} de ${oldstatus} a ${
            ROUpdate.statusVehicle
          }`,
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
  @Recepcion()
  @Repuesto()
  @UseGuards(AuthGuard)
  @Post('/list')
  findAll(
    @Request() request,
    @Body() filters: FilterOrderDto,
    @Body('page') page: number = 1,
    @Body('pageSize') pageSize: number = 30,
    @Body('status') statusTab: string = 'all',
  ) {
    const filtro: any = filters;
    const user = request['user'];

    if (!filtro.filter || filtro.filter === 'all') {
      if (user.role !== 'Cotizador') {
        return this.repairOrdersService.findAll(
          {
            workshop: new mongoose.Types.ObjectId(user.workshop),
          },
          page,
          pageSize,
          statusTab,
        );
      } else {
        return this.repairOrdersService.findAll(
          {
            workshop: new mongoose.Types.ObjectId(user.workshop),
            'budgetData.quoter._id': new mongoose.Types.ObjectId(user._id),
          },
          page,
          pageSize,
          statusTab,
        );
      }
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
        if (user.role !== 'Cotizador') {
          return this.repairOrdersService.findOrderByFilter(
            { workshop: new mongoose.Types.ObjectId(user.workshop) },
            { ...filtro, label: filterField },
            page,
            pageSize,
          );
        } else {
          return this.repairOrdersService.findOrderByFilter(
            {
              workshop: new mongoose.Types.ObjectId(user.workshop),
              'budgetData.quoter._id': new mongoose.Types.ObjectId(user._id),
            },
            { ...filtro, label: filterField },
            page,
            pageSize,
          );
        }
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
      message: `Cambió estado de las piezas de la RO ${codeRO(orderUpdate)}`,
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

    let orderUpdate = await this.repairOrdersService.generateOT(
      orderData[0],
      data,
    );

    const oldstatus = orderUpdate.statusVehicle ?? '';

    await this.historiesService.createHistory({
      message: `Emitió la OT de la RO ${codeRO(orderUpdate)}`,
      user: user._id,
      ro: orderUpdate.id,
    });

    if (orderUpdate.budgetData.type === 'Suplemento') {
      const orderPrincipal = await this.repairOrdersService.findBy({
        workshop: new Types.ObjectId(user.workshop),
        'budgetData.code': orderUpdate.budgetData.code,
        'budgetData.type': 'Principal',
      });

      if (orderPrincipal.length > 0) {
        const dataROs = await this.repairOrdersService.changeMovements(
          [orderUpdate],
          {
            movements: [
              {
                id: orderUpdate.id,
                statusInput: orderPrincipal[0].statusVehicle,
              },
            ],
          },
          user,
        );

        await this.historiesService.createHistory({
          message: `Cambió estado RO ${codeRO(dataROs[0])} de ${oldstatus} a ${
            orderPrincipal[0].statusVehicle
          }`,
          user: user._id,
          ro: dataROs[0].id,
        });
        orderUpdate = dataROs[0];
      }
    }
    return orderUpdate;
  }

  @Recepcion()
  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/movements')
  async movements(@Request() request, @Body() data: MovementsRepairOrderDto) {
    const user = request['user'];
    const ids = map(data.movements, (item: any) => new Types.ObjectId(item.id));

    const RODatas = await this.repairOrdersService.findBy({
      workshop: new Types.ObjectId(user.workshop),
      _id: { $in: ids },
    });

    const oldstatus = RODatas[0].statusVehicle ?? '';

    if (RODatas.length > 0) {
      const ROSUpdate = await this.repairOrdersService.changeMovements(
        RODatas,
        data,
        user,
      );

      if (ROSUpdate) {
        let response = [];
        for (let i = 0; i < ROSUpdate.length; i++) {
          const ro = ROSUpdate[i];
          response.push(
            await this.historiesService.createHistory({
              message: `Cambió estado RO ${codeRO(ro)} de ${oldstatus} a ${
                ROSUpdate[i].statusVehicle
              }`,
              user: user._id,
              ro: ro.id,
            }),
          );
        }

        response = await Promise.all(response);
        return ROSUpdate;
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
  @Repuesto()
  @UseGuards(AuthGuard)
  @Post('/autoparts')
  async autoparts(@Request() request, @Body() filters: FilterOrderDto) {
    const filtro: any = filters;
    const user = request['user'];

    if (!filtro.filter || filtro.filter === 'all') {
      if (user.role !== 'Cotizador') {
        const data = await this.repairOrdersService.findAll(
          {
            workshop: new mongoose.Types.ObjectId(user.workshop),
            status: 'Abierta',
          },
          1,
          999999,
        );
        return this.repairOrdersService.autopartsMapping(data.results);
      } else {
        const data = await this.repairOrdersService.findAll(
          {
            workshop: new mongoose.Types.ObjectId(user.workshop),
            status: 'Abierta',
            'budgetData.quoter._id': new mongoose.Types.ObjectId(user._id),
          },
          1,
          999999,
        );
        return this.repairOrdersService.autopartsMapping(data.results);
      }
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

        if (user.role !== 'Cotizador') {
          return this.repairOrdersService.autoparts(
            {
              workshop: new mongoose.Types.ObjectId(user.workshop),
              status: 'Abierta',
            },
            { ...filtro, label: filterField },
          );
        } else {
          return this.repairOrdersService.autoparts(
            {
              workshop: new mongoose.Types.ObjectId(user.workshop),
              status: 'Abierta',
              'budgetData.quoter._id': new mongoose.Types.ObjectId(user._id),
            },
            { ...filtro, label: filterField },
          );
        }
      }
    } else {
      return new BadRequestException('value requerid');
    }
  }

  @Master()
  @Admin()
  @Cotizador()
  @Recepcion()
  @UseGuards(AuthGuard)
  @Post('/warranty')
  async warranty(@Request() request, @Body() data: WarrantyOrderDto) {
    const user = request['user'];

    const orderData = await this.repairOrdersService.findBy({
      workshop: new Types.ObjectId(user.workshop),
      _id: new Types.ObjectId(data.id),
      'budgetData.type': 'Principal',
    });

    if (orderData.length > 0) {
      const updated = await this.repairOrdersService.generateWarranty(
        orderData[0],
        data,
        user,
      );

      const code = orderData[0].code.toString().padStart(6, '0');
      const number = updated.numberWarranty === 0 ? '' : updated.numberWarranty;

      await this.historiesService.createHistory({
        message:
          data.mode === 'new'
            ? `Agregó reclamo de garantía a RO ${codeRO(orderData[0])}`
            : `Edito reclamo de garantía ${code}-G${number}`,
        user: user._id,
        ro: data.mode === 'new' ? orderData[0]._id : updated.masterRo,
      });

      return updated;
    } else {
      return new NotFoundException('RO no encontrado');
    }
  }
}
