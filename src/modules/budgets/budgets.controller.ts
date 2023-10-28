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

@Controller('budgets')
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly historiesService: HistoriesService,
    private readonly vehiclesService: VehiclesService,
    private readonly clientsService: ClientsService,
  ) {}

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
    //TODO falta el flujo para cuando es un vehiculo registrado pero se cambia de dueño u otra info que pueda actualizarse del vehiculo
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
    const newBufget = await this.budgetsService.create(createBudgetDto);
    const log = await this.historiesService.createHistory({
      message: `Creación del presupuesto ${newBufget.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      budget: newBufget.id,
    });
    newBufget.history.push(log.id);
    newBufget.save();
    return newBufget;
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

  //TODO
  //insertar presupuestos de pruebas
  //listar presumuestos de pruebas
}
