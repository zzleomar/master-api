import {
  Controller,
  Post,
  Body,
  Request,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { AuthGuard } from '../auth/auth.guard';
import { HistoriesService } from '../histories/histories.service';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { CreateVehicleDto } from '../vehicles/dto/create-vehicle.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ClientsService } from '../clients/clients.service';
import {
  Admin,
  Cotizador,
  Master,
  Recepcion,
  Repuesto,
} from '../auth/utils/decorator';
import { FilterBudgetDto } from './dto/filter-bugget.dto';
import { InspectionBudgetDto } from './dto/inspection-budget.dto';
import mongoose from 'mongoose';
import { StatusBudgetDto } from './dto/status-budget.dto';
import { StatusBudget } from './entities/budget.entity';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { UpdateVehicleDto } from '../vehicles/dto/update-vehicle.dto';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { CreateSupplementBudgetDto } from './dto/create-supplement-budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly historiesService: HistoriesService,
    private readonly vehiclesService: VehiclesService,
    private readonly clientsService: ClientsService,
    private readonly repairOrdersService: RepairOrdersService,
  ) {}

  @Recepcion()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/supplement')
  async createSupplement(
    @Request() request,
    @Body() createSupplementBudgetDto: CreateSupplementBudgetDto,
  ) {
    const user = request['user'];
    const budgetData = await this.budgetsService.findOne(
      createSupplementBudgetDto.budgetId,
    );
    if (budgetData.type === 'Principal') {
      const budgetSupplement = await this.budgetsService.createSupplement(
        budgetData,
        createSupplementBudgetDto,
      );
      if (budgetSupplement) {
        const log = await this.historiesService.createHistory({
          message: `Creación un suplemento ${
            createSupplementBudgetDto.typeSupplement
          } del presupuesto ${budgetData.code.toString().padStart(6, '0')}`,
          user: user._id,
          budget: budgetData.id,
        });
        budgetData.history.push(log.id);
        budgetData.save();
        return budgetSupplement;
      } else {
        return new BadRequestException('No es posible crear este suplemento');
      }
    } else {
      return new BadRequestException(
        'Los presupuestos se crean de presupuestos principales',
      );
    }
  }

  @Recepcion()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Request() request,
    @Body() createBudgetDto: CreateBudgetDto,
    @Body() createVehicleDto: CreateVehicleDto,
    @Body() createClientDto: CreateClientDto,
  ) {
    const user = request['user'];
    if (
      (!createBudgetDto.client && createBudgetDto.mode === 'normal') ||
      (createBudgetDto.mode === 'express' && createBudgetDto.newOwner)
    ) {
      createClientDto.workshop = user.workshop;
      const newClient = await this.clientsService.create(createClientDto);
      createBudgetDto.client = newClient.id;
      await this.historiesService.createHistory({
        message: `Registro de un nuevo cliente`,
        user: user._id,
        client: newClient.id,
      });
    } else {
      createBudgetDto.client = createVehicleDto.owner;
    }

    if (
      (!createBudgetDto.vehicle && createBudgetDto.mode === 'normal') ||
      (createBudgetDto.mode === 'express' && createBudgetDto.editVehicle)
    ) {
      createVehicleDto.owner = createBudgetDto.client;
      createVehicleDto.workshop = user.workshop;
      const newVehicle = await this.vehiclesService.create(createVehicleDto);
      createBudgetDto.vehicle = newVehicle;
      await this.historiesService.createHistory({
        message:
          createBudgetDto.mode === 'normal'
            ? `Registro de un nuevo vehiculo`
            : `Se actualizo los datos de un vehiculo`,
        user: user._id,
        vehicle: newVehicle.id,
      });
    } else {
      const newVehicle = await this.vehiclesService.findOne(
        createBudgetDto.vehicle,
      );
      createBudgetDto.vehicle = newVehicle;
    }
    createBudgetDto.workshop = user.workshop;
    createBudgetDto.comment = '';
    const newBudget = await this.budgetsService.create(createBudgetDto);
    const log = await this.historiesService.createHistory({
      message: `Creación del presupuesto ${newBudget.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      budget: newBudget.id,
    });
    newBudget.history.push(log.id);
    newBudget.save();
    return newBudget;
  }

  @Recepcion()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/update')
  async update(
    @Request() request,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const user = request['user'];
    const dataBudgets = await this.budgetsService.findBy({
      _id: updateBudgetDto.id,
    });
    const dataBudget = dataBudgets[0];
    //TODO falta el flujo de los presupuestos suplementarios
    if (updateBudgetDto.editOwner) {
      await this.clientsService.update(
        dataBudget.clientData._id,
        updateClientDto,
      );
      await this.historiesService.createHistory({
        message: `Datos del cliente actualizados`,
        user: user._id,
        client: dataBudget.clientData._id,
      });
    }
    updateBudgetDto.client = dataBudget.clientData._id;
    if (updateBudgetDto.editVehicle) {
      await this.vehiclesService.update(
        dataBudget.vehicleData._id,
        updateVehicleDto,
      );
      await this.historiesService.createHistory({
        message: `Datos del vehiculo actualizados`,
        user: user._id,
        vehicle: dataBudget.vehicleData._id,
      });
    }

    updateBudgetDto.workshop = user.workshop;
    const newBudget = await this.budgetsService.update(
      dataBudget._id,
      updateBudgetDto,
    );
    const order = await this.repairOrdersService.findBy(
      {
        budget: newBudget._id,
      },
      false,
    );
    if (order.length === 1) {
      await this.repairOrdersService.updateBudget(order[0], newBudget);
    }
    const log = await this.historiesService.createHistory({
      message: `Datos del presupuesto ${newBudget.code
        .toString()
        .padStart(6, '0')} actualizado`,
      user: user._id,
      budget: newBudget.id,
    });
    newBudget.history.push(log.id);
    newBudget.save();
    return newBudget;
  }

  @Recepcion()
  @Master()
  @Admin()
  @Repuesto()
  @Recepcion()
  @UseGuards(AuthGuard)
  @Post('/list')
  findAll(@Request() request, @Body() filters: FilterBudgetDto) {
    const filtro: any = filters;
    const user = request['user'];
    if (!filtro.filter || filtro.filter === 'all') {
      return this.budgetsService.findAll({ workshop: user.workshop });
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
            filterField = 'insuranceCompany.name';
            break;
          case 'client':
            filterField = 'clientData.fullName';
            break;
          case 'vehicle':
            filterField = 'vehicleData.plate';
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
            filterField = 'vehicleData.plate';
            break;
        }

        return this.budgetsService.findBudgetsByFilter(
          { workshop: user.workshop },
          { ...filtro, label: filterField },
        );
      }
    } else {
      return new BadRequestException('value requerid');
    }
  }

  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/inspection')
  async inspection(@Request() request, @Body() data: InspectionBudgetDto) {
    const user = request['user'];
    const budgetData = await this.budgetsService.findBy({
      workshop: user.workshop,
      _id: data.budgetId,
    });
    const budgetUpdate = await this.budgetsService.saveInspection(
      budgetData[0],
      data,
    );
    await this.historiesService.createHistory({
      message: `Registro de inspección del presupuesto ${budgetUpdate.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      budget: budgetUpdate.id,
    });
    return budgetUpdate;
  }

  @Recepcion()
  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/status')
  async status(@Request() request, @Body() data: StatusBudgetDto) {
    const user = request['user'];
    const budgetData = await this.budgetsService.findBy({
      workshop: user.workshop,
      _id: data.id,
    });
    if (
      data.status == StatusBudget.Espera &&
      budgetData[0].status === 'Estimado'
    ) {
      const budgetUpdate = await this.budgetsService.updateStatus(
        budgetData[0],
        data.status,
        budgetData[0].status,
        user,
      );
      return budgetUpdate;
    } else if (
      data.status == StatusBudget.Expirado &&
      budgetData[0].status === StatusBudget.Espera
    ) {
      const budgetUpdate = await this.budgetsService.updateStatus(
        budgetData[0],
        data.status,
        budgetData[0].status,
        user,
      );
      return budgetUpdate;
    } else {
      return new BadRequestException('Cambio de estado invalido');
    }
  }
}
