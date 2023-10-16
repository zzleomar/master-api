import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { AuthGuard } from '../auth/auth.guard';
import { HistoriesService } from '../histories/histories.service';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { CreateVehicleDto } from '../vehicles/dto/create-vehicle.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ClientsService } from '../clients/clients.service';
import { Admin, Master, Recepcion, Repuesto } from '../auth/utils/decorator';

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
    if (!createBudgetDto.client) {
      const newClient = await this.clientsService.create(createClientDto);
      createBudgetDto.client = newClient.id;
      await this.historiesService.createHistory({
        message: `Registro de un nuevo cliente`,
        user: user._id,
        client: newClient.id,
      });
    }
    if (!createBudgetDto.vehicle) {
      createVehicleDto.owner = createBudgetDto.client;
      const newVehicle = await this.vehiclesService.create(createVehicleDto);
      createBudgetDto.vehicle = newVehicle.id;
      await this.historiesService.createHistory({
        message: `Registro de un nuevo vehiculo`,
        user: user._id,
        vehicle: newVehicle.id,
      });
    }
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
  @Repuesto()
  @Recepcion()
  @UseGuards() // AuthGuard
  @Get()
  findAll(@Request() request) {
    const user = request['user'];
    const search = request['query']['search'] || null;

    return this.budgetsService.findAll({
      workshop: user.workshop,
      search: search,
    });
  }

  //TODO
  //insertar presupuestos de pruebas
  //listar presumuestos de pruebas
}
