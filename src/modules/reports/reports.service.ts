import { Injectable } from '@nestjs/common';
import { FilterReportsDto } from './dto/filter-reports.dto';
import { MakesModelsService } from '../makes-models/makes-models.service';
import { ColorsService } from '../colors/colors.service';
import { InsurancesService } from '../insurances/insurances.service';
import { HistoriesService } from '../histories/histories.service';
import { BudgetsService } from '../budgets/budgets.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ClientsService } from '../clients/clients.service';
import { PartsService } from '../parts/parts.service';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { WorkshopsService } from '../workshops/workshops.service';
import * as moment from 'moment';
import {
  StatusRepairOrder,
  StatusVehicle,
} from '../repair-orders/entities/repair-order.entity';

@Injectable()
export class ReportsService {
  constructor(
    private readonly userService: UsersService,
    private readonly workshopService: WorkshopsService,
    private readonly authService: AuthService,
    private readonly makesModelsService: MakesModelsService,
    private readonly colorsService: ColorsService,
    private readonly insurancesService: InsurancesService,
    private readonly clientsService: ClientsService,
    private readonly vehiclesService: VehiclesService,
    private readonly budgetsService: BudgetsService,
    private readonly repairOrdersService: RepairOrdersService,
    private readonly historiesService: HistoriesService,
    private readonly partsService: PartsService,
  ) {}
  async reportOrders(filter: FilterReportsDto) {
    const startDate = moment(filter.initDate, 'DD/MM/YYYY HH:mm:ss').toDate();
    const endDate = moment(filter.endDate, 'DD/MM/YYYY HH:mm:ss').toDate();
    let resultsOpen = 0;
    let resultsNule = 0;
    let resultsComplete = 0;
    if (filter.type === 'today') {
      resultsOpen = await this.repairOrdersService.findByCount({
        'budgetData.type': 'Principal',
        status: StatusRepairOrder.Abierta,
      });
      resultsNule = await this.repairOrdersService.findByCount({
        'budgetData.type': 'Principal',
        status: StatusRepairOrder.Anulada,
      });
      resultsComplete = await this.repairOrdersService.findByCount({
        'budgetData.type': 'Principal',
        status: StatusRepairOrder.Completada,
      });
    } else {
      resultsOpen = await this.repairOrdersService.findByCount({
        'budgetData.type': 'Principal',
        statusChange: {
          $elemMatch: {
            status: StatusRepairOrder.Abierta,
            initDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      });
      resultsNule = await this.repairOrdersService.findByCount({
        'budgetData.type': 'Principal',
        statusChange: {
          $elemMatch: {
            status: StatusRepairOrder.Anulada,
            initDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      });
      resultsComplete = await this.repairOrdersService.findByCount({
        'budgetData.type': 'Principal',
        statusChange: {
          $elemMatch: {
            status: StatusRepairOrder.Completada,
            initDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      });
    }
    return {
      Abierta: resultsOpen,
      Anulada: resultsNule,
      Completada: resultsComplete,
    };
  }

  async statusWorkshop() {
    const esperandoAprobacion = await this.repairOrdersService.findByCount({
      'budgetData.type': 'Principal',
      statusVehicle: StatusVehicle.EsperandoAprobacion,
    });
    const esperandoTurno = await this.repairOrdersService.findByCount({
      'budgetData.type': 'Principal',
      statusVehicle: StatusVehicle.EsperandoTurno,
      initOT: {
        $ne: null,
        $exists: true,
      },
    });
    const tabajosActivos = await this.repairOrdersService.findByCount({
      'budgetData.type': 'Principal',
      statusVehicle: {
        $in: [
          'Enderezado',
          'Preparación',
          'Pintura',
          'Armado',
          'Mecánica',
          'Alineamiento',
          'A. Acondicionado',
          'Aire Acondicionado',
          'Detalle',
          'T. c/piezas pend.',
          'Terminado con piezas pendientes',
          'T. sin entregar',
          'Terminado sin entregar',
        ],
      },
    });
    return {
      waitingApproval: esperandoAprobacion,
      waitingTurn: esperandoTurno,
      activeJobs: tabajosActivos,
    };
  }

  async insuranceReport(filter: FilterReportsDto) {
    const startDate = moment(filter.initDate, 'DD/MM/YYYY HH:mm:ss').toDate();
    const endDate = moment(filter.endDate, 'DD/MM/YYYY HH:mm:ss').toDate();
    const data = await this.repairOrdersService.report(startDate, endDate);
    const insurances = await this.insurancesService.findAll();
    return insurances.map((insurance: any) => {
      const item = data.find((i: any) => {
        return insurance._id.equals(i._id._id);
      });
      const total = item ? item.total : 0;
      return {
        name: insurance.name,
        total,
      };
    });
  }
}
