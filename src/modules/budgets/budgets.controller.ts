import {
  Controller,
  Get,
  Post,
  Body,
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

@Controller('budgets')
export class BudgetsController {
  constructor(
    private readonly budgetsService: BudgetsService,
    private readonly historiesService: HistoriesService,
    private readonly vehiclesService: VehiclesService,
    private readonly clientsService: ClientsService,
  ) {}

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
      createBudgetDto.client = newClient._id;
      await this.historiesService.createHistory({
        message: `Registro de un nuevo cliente`,
        user: user._id,
        client: newClient._id,
      });
    }
    if (!createBudgetDto.vehicle) {
      const newVehicle = await this.vehiclesService.create(createVehicleDto);
      createBudgetDto.vehicle = newVehicle._id;
    }
    const newBufget = await this.budgetsService.create(createBudgetDto);
    await this.historiesService.createHistory({
      message: `Creación del presupuesto ${newBufget.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      budget: newBufget._id,
    });
    return newBufget;
  }

  @Get()
  findAll() {
    return this.budgetsService.findAll();
  }

  //TODO
  //insertar presupuestos de pruebas
  //listar presumuestos de pruebas
}
