import {
  Controller,
  Post,
  Body,
  Request,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService, FindAllResponse } from './budgets.service';
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
import { FilterGetAllDto } from './dto/filter-bugget.dto';
import { InspectionBudgetDto } from './dto/inspection-budget.dto';
import mongoose, { Types } from 'mongoose';
import { StatusBudgetDto } from './dto/status-budget.dto';
import { StatusBudget } from './entities/budget.entity';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { UpdateVehicleDto } from '../vehicles/dto/update-vehicle.dto';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { CreateSupplementBudgetDto } from './dto/create-supplement-budget.dto';
import { StatusRepairOrder } from '../repair-orders/entities/repair-order.entity';
import { codeBudget } from './utils/parseLabel';
import * as moment from 'moment';

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
  @Cotizador()
  @Master()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/supplement')
  async createSupplement(
    @Request() request,
    @Body() createSupplementBudgetDto: CreateSupplementBudgetDto,
  ) {
    const TypeSupplement: any = {
      Adicionales: 'Adicional',
      Mecanica: 'Mecánica',
      Otros: 'Otro',
    };

    const user = request['user'];
    const budgetData = await this.budgetsService.findOne(
      createSupplementBudgetDto.budgetId,
    );

    const roData = await this.repairOrdersService.findBy({
      budget: new mongoose.Types.ObjectId(createSupplementBudgetDto.budgetId),
    });
    if (
      budgetData.type === 'Principal' &&
      roData[0].status === StatusRepairOrder.Abierta
    ) {
      const budgetSupplement = await this.budgetsService.createSupplement(
        budgetData,
        createSupplementBudgetDto,
      );
      if (budgetSupplement) {
        const log = await this.historiesService.createHistory({
          message: `Registró suplemento de tipo ${
            TypeSupplement[
              createSupplementBudgetDto.typeSupplement as keyof typeof TypeSupplement
            ]
          } al presupuesto ${codeBudget(budgetData)}`,
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
        'No se puede agregar suplemento a ese presupuesto, cree uno nuevo',
      );
    }
  }

  @Recepcion()
  @Master()
  @Cotizador()
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
    let newClient: any = null;
    let newVehicle: any = null;

    if (
      (!createBudgetDto.client && createBudgetDto.mode === 'normal') ||
      (createBudgetDto.mode === 'express' && createBudgetDto.newOwner)
    ) {
      createClientDto.workshop = user.workshop;
      newClient = await this.clientsService.create(createClientDto);
      createBudgetDto.client = newClient.id;
    } else {
      createBudgetDto.client = createVehicleDto.owner;
    }

    if (
      (!createBudgetDto.vehicle && createBudgetDto.mode === 'normal') ||
      (createBudgetDto.mode === 'express' && createBudgetDto.editVehicle)
    ) {
      createVehicleDto.owner = createBudgetDto.client;
      createVehicleDto.workshop = user.workshop;
      newVehicle = await this.vehiclesService.create(createVehicleDto);
      createBudgetDto.vehicle = newVehicle;
    } else {
      const vehicle = await this.vehiclesService.findOne(
        createBudgetDto.vehicle,
      );
      createBudgetDto.vehicle = vehicle;
    }

    createBudgetDto.workshop = user.workshop;
    createBudgetDto.comment = '';
    const newBudget = await this.budgetsService.create(createBudgetDto);
    const log = await this.historiesService.createHistory({
      message: `Registró el presupuesto ${codeBudget(newBudget)}`,
      user: user._id,
      budget: newBudget.id,
    });
    newBudget.history.push(log.id);
    newBudget.save();

    if (newClient !== null) {
      await this.historiesService.createHistory({
        message: `Registró un nuevo cliente en el presupuesto ${codeBudget(
          newBudget,
        )}`,
        user: user._id,
        client: newClient.id,
        budget: newBudget.id,
      });
    }

    if (newVehicle !== null) {
      await this.historiesService.createHistory({
        message:
          createBudgetDto.mode === 'normal'
            ? `Registró un nuevo vehículo en el presupuesto ${codeBudget(
                newBudget,
              )}`
            : `Editó datos del vehiculo en el presupuesto ${codeBudget(
                newBudget,
              )}`,
        user: user._id,
        vehicle: newVehicle.id,
        budget: newBudget.id,
      });
    }

    return newBudget;
  }

  @Cotizador()
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
    let modifyGeneral: number = 0;
    const user = request['user'];
    const dataBudgets = await this.budgetsService.findBy({
      _id: updateBudgetDto.id,
    });

    const dataBudget = dataBudgets[0];

    const day1 = moment(updateBudgetDto.creationDate, 'DD/MM/YYYY').format(
      'DD/MM/YYYY',
    );
    const day2 = moment(dataBudget.creationDate).format('DD/MM/YYYY');
    const cot1: string = updateBudgetDto.quoter;
    const cot2: string = dataBudget.quoter._id;

    if (updateBudgetDto.editOwner) {
      await this.clientsService.update(
        dataBudget.clientData._id,
        updateClientDto,
      );
      await this.historiesService.createHistory({
        message: `Editó datos del cliente en el presupuesto ${codeBudget(
          dataBudget,
        )}`,
        user: user._id,
        client: dataBudget.clientData._id,
        budget: dataBudget.id,
      });
    }

    updateBudgetDto.client = dataBudget.clientData._id;
    if (updateBudgetDto.editVehicle) {
      modifyGeneral++;
      await this.vehiclesService.update(
        dataBudget.vehicleData._id,
        updateVehicleDto,
      );
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

    if (day1 !== day2) {
      modifyGeneral++;
    }
    if (cot1 != cot2) {
      modifyGeneral++;
    }

    if (
      updateBudgetDto.insuranceCompany != dataBudget.insuranceCompany._id ||
      updateBudgetDto.claimNumber != dataBudget.claimNumber ||
      updateBudgetDto.adjusterEmail != dataBudget.adjusterEmail ||
      updateBudgetDto.adjusterCell != dataBudget.adjusterCell ||
      updateBudgetDto.adjuster != dataBudget.adjuster
    ) {
      modifyGeneral++;
    }

    if (modifyGeneral === 4) {
      const log = await this.historiesService.createHistory({
        message: `Editó información general del presupuesto ${codeBudget(
          newBudget,
        )}`,
        user: user._id,
        budget: newBudget.id,
      });
      newBudget.history.push(log.id);
    } else {
      if (updateBudgetDto.editVehicle) {
        const log1 = await this.historiesService.createHistory({
          message: `Editó datos del vehiculo en el presupuesto ${codeBudget(
            dataBudget,
          )}`,
          user: user._id,
          vehicle: dataBudget.vehicleData._id,
          budget: dataBudget.id,
        });
        newBudget.history.push(log1.id);
      }

      if (
        updateBudgetDto.insuranceCompany != dataBudget.insuranceCompany._id ||
        updateBudgetDto.claimNumber != dataBudget.claimNumber ||
        updateBudgetDto.adjusterEmail != dataBudget.adjusterEmail ||
        updateBudgetDto.adjusterCell != dataBudget.adjusterCell ||
        updateBudgetDto.adjuster != dataBudget.adjuster
      ) {
        const log2 = await this.historiesService.createHistory({
          message: `Editó datos del seguro vehícular del presupuesto ${codeBudget(
            dataBudget,
          )}`,
          user: user._id,
          budget: dataBudget.id,
        });
        newBudget.history.push(log2.id);
      }
      if (cot1 != cot2) {
        const log3 = await this.historiesService.createHistory({
          message: `Editó cotizador del presupuesto ${codeBudget(dataBudget)}`,
          user: user._id,
          budget: dataBudget.id,
        });
        newBudget.history.push(log3.id);
      }
      if (day1 !== day2) {
        const log4 = await this.historiesService.createHistory({
          message: `Editó fecha de cotización del presupuesto ${codeBudget(
            dataBudget,
          )}`,
          user: user._id,
          budget: dataBudget._id,
        });
        newBudget.history.push(log4.id);
      }
    }

    newBudget.save();
    return newBudget;
  }

  @Recepcion()
  @Master()
  @Admin()
  @Repuesto()
  @Cotizador()
  @Recepcion()
  @UseGuards(AuthGuard)
  @Post('/list')
  findAll(
    @Request() request,
    @Body() filters: FilterGetAllDto,
    @Body('page') page: number = 1,
    @Body('pageSize') pageSize: number = 30,
    @Body('status') statusTab: string = 'all',
  ): Promise<FindAllResponse> {
    const filtro: any = filters;
    const user = request['user'];
    if (!filtro.filter || filtro.filter === 'all') {
      if (user.role === 'Cotizador') {
        return this.budgetsService.findAll(
          { workshop: user.workshop, quoter: new Types.ObjectId(user._id) },
          page,
          pageSize,
          statusTab,
        );
      } else {
        return this.budgetsService.findAll(
          { workshop: user.workshop },
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
        // if (user.role === 'Cotizador') {
        //   return this.budgetsService.findBudgetsByFilter(
        //     { workshop: user.workshop, quoter: new Types.ObjectId(user._id) },
        //     { ...filtro, label: filterField },
        //     page,
        //     pageSize,
        //   );
        // }
        return this.budgetsService.findBudgetsByFilter(
          { workshop: user.workshop },
          { ...filtro, label: filterField },
          page,
          pageSize,
        );
      }
    } else {
      throw new BadRequestException('value requerid');
    }
  }

  @Cotizador()
  @Master()
  @Recepcion()
  @Admin()
  @UseGuards(AuthGuard)
  @Post('/inspection')
  async inspection(@Request() request, @Body() data: InspectionBudgetDto) {
    const user = request['user'];

    const budgetData: any = await this.budgetsService.findBy({
      workshop: user.workshop,
      _id: data.budgetId,
    });
    const mode: boolean =
      budgetData[0] && budgetData[0].inspection !== undefined;

    const budgetUpdate = await this.budgetsService.saveInspection(
      budgetData[0],
      data,
    );

    await this.historiesService.createHistory({
      message: `${
        mode ? 'Editó' : 'Registró'
      } inspección del vehículo del presupuesto ${codeBudget(budgetUpdate)}`,
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
