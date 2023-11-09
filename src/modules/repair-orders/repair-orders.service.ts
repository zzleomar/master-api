import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { Budget, StatusBudget } from '../budgets/entities/budget.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { filter, map } from 'lodash';
import { HistoriesService } from '../histories/histories.service';
import { StatusRepairOrderstDto } from './dto/status-budget.dto';
import { StatusRepairOrder } from './entities/repair-order.entity';
import { RepairOrder, StatusVehicle } from './entities/repair-order.entity';
import { BudgetsService } from '../budgets/budgets.service';

@Injectable()
export class RepairOrdersService {
  constructor(
    @InjectModel('RepairOrder') private readonly repairOrderModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly historiesService: HistoriesService,
    private readonly budgetsSevice: BudgetsService,
  ) {}

  async create(
    createRepairOrderDto: CreateRepairOrderDto,
    dataBudgets: Budget,
    user: any,
  ) {
    try {
      const body: any = { ...createRepairOrderDto };
      await this.workshopsService.findOne(body.workshop);
      const pieces = map(
        filter(
          dataBudgets.inspection.pieces,
          (item: any) =>
            item.operation === 'Cambiar' ||
            item.operation === 'Cambiar y pintar',
        ),
        (item2: any) => {
          return {
            piece: item2.piece.name,
            price: null,
            status: null,
            receptionDate: null,
            provider: null,
            comment: null,
          };
        },
      );
      body.workshop = new Types.ObjectId(body.workshop);
      const createdOrder = new this.repairOrderModel(body);
      createdOrder.budget = new Types.ObjectId(dataBudgets._id);
      createdOrder.budgetData = dataBudgets.toObject();
      createdOrder.code = await this.getLastCode();

      createdOrder.pieces = pieces;
      //si la orden de compra esta aprobada y el carro esta en el taller
      if (createRepairOrderDto.approved && createRepairOrderDto.inTheWorkshop) {
        if (pieces.length === 0) {
          createdOrder.statusVehicle = StatusVehicle.EsperandoTurno;
        } else {
          createdOrder.statusVehicle = StatusVehicle.EsperandoPieza;
        }
        this.budgetsSevice.updateStatus(
          dataBudgets,
          StatusBudget.Aprobado,
          StatusBudget.Espera,
          user,
        );
      }

      //si la orden de compra esta aprobada y el carro no esta en el taller
      if (
        createRepairOrderDto.approved &&
        !createRepairOrderDto.inTheWorkshop
      ) {
        if (pieces.length === 0) {
          createdOrder.statusVehicle = StatusVehicle.EsperandoCliente;
        } else {
          createdOrder.statusVehicle = StatusVehicle.EsperandoPieza;
        }
        this.budgetsSevice.updateStatus(
          dataBudgets,
          StatusBudget.Aprobado,
          StatusBudget.Espera,
          user,
        );
      }

      //si la orden de compra no esta aprobada y el carro esta en el taller
      if (
        !createRepairOrderDto.approved &&
        createRepairOrderDto.inTheWorkshop
      ) {
        createdOrder.statusVehicle = StatusVehicle.EsperandoAprobacion;
      }
      createdOrder.statusChangeVehicle = [
        {
          initDate: new Date(),
          endDate: null,
          status: createdOrder.statusVehicle,
        },
      ];
      createdOrder.statusChange = [
        {
          initDate: new Date(),
          endDate: null,
          status: 'Abierta',
        },
      ];

      const order = await createdOrder.save();
      await this.historiesService.createHistory({
        message: `Creación de RO ${order.code.toString().padStart(6, '0')}`,
        user: user._id,
        ro: createdOrder.id,
      });

      return order;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(filter: any): Promise<any[]> {
    return this.repairOrderModel.find(filter).exec();
  }

  async getLastCode(): Promise<number> {
    const lastOrder = await this.repairOrderModel.findOne(
      {},
      { code: 1 },
      { sort: { code: -1 } },
    );
    const lastCode = lastOrder ? lastOrder.code : 0; // Si no hay documentos, devuelve 0 como valor predeterminado.
    return lastCode + 1; // Incrementa el último código encontrado en uno para obtener el nuevo código.
  }

  async findBy(filter: any, error: boolean = true): Promise<any[]> {
    const repairOrder = await this.repairOrderModel.find({ ...filter }).exec();

    if (!repairOrder && error) {
      throw new NotFoundException(
        `repairOrders with ${JSON.stringify(filter)} not found `,
      );
    }

    return repairOrder;
  }

  async changeStatus(
    dataRO: RepairOrder,
    data: StatusRepairOrderstDto,
    user: any,
  ) {
    let ro;
    switch (dataRO.statusVehicle) {
      case 'Esperando piezas':
        if (data.inTheWorkshop && data.piecesToWork) {
          ro = await this.updateStatusVehicle(
            dataRO,
            StatusVehicle.EsperandoTurno,
            dataRO.statusVehicle,
            {
              inTheWorkshop: data.inTheWorkshop,
              piecesToWork: data.piecesToWork,
            },
          );
        }
        if (!data.inTheWorkshop && data.piecesToWork) {
          ro = await this.updateStatusVehicle(
            dataRO,
            StatusVehicle.EsperandoCliente,
            dataRO.statusVehicle,
            {
              inTheWorkshop: data.inTheWorkshop,
              piecesToWork: data.piecesToWork,
            },
          );
        }
        break;
      case 'Esperando aprobación':
        if (data.approved) {
          ro = await this.updateStatusVehicle(
            dataRO,
            StatusVehicle.EsperandoPieza,
            dataRO.statusVehicle,
            {
              approved: data.approved,
            },
          );
          const dataBudgets = await this.budgetsSevice.findBy({
            _id: dataRO.budgetData._id,
          });
          this.budgetsSevice.updateStatus(
            dataBudgets[0],
            StatusBudget.Aprobado,
            StatusBudget.Espera,
            user,
          );
        }
        break;
      case 'Esperando cliente':
        if (data.inTheWorkshop) {
          ro = await this.updateStatusVehicle(
            dataRO,
            StatusVehicle.EsperandoTurno,
            dataRO.statusVehicle,
            {
              inTheWorkshop: data.inTheWorkshop,
              piecesToWork: data.piecesToWork,
            },
          );
        }
        break;
      default:
        ro = null;
        break;
    }
    return ro;
  }

  async updateStatusVehicle(
    dataRO: RepairOrder,
    statusNew: StatusVehicle,
    statusLast: StatusVehicle,
    data?: any,
  ) {
    const now = new Date();
    dataRO.statusVehicle = statusNew;
    const itemKeyChange = dataRO.statusChangeVehicle.findIndex(
      (item: any) => item.status === statusLast,
    );
    if (itemKeyChange !== undefined && itemKeyChange !== null) {
      dataRO.statusChangeVehicle[itemKeyChange].endDate = now;
    }
    dataRO.statusChangeVehicle.push({
      initDate: new Date(),
      endDate: null,
      status: statusNew,
    });
    dataRO.approved =
      data.approved !== undefined ? data.approved : dataRO.approved;
    dataRO.inTheWorkshop =
      data.inTheWorkshop !== undefined
        ? data.inTheWorkshop
        : dataRO.inTheWorkshop;
    dataRO.piecesToWork =
      data.piecesToWork !== undefined ? data.piecesToWork : dataRO.piecesToWork;
    await this.repairOrderModel.updateOne({ _id: dataRO._id }, dataRO);

    return dataRO;
  }

  async findOrderByFilter(filter: any, value: any): Promise<any[]> {
    return this.repairOrderModel
      .aggregate([
        {
          $match: {
            [value.label]:
              typeof value.value === 'string'
                ? { $regex: value.value, $options: 'i' }
                : value.value,
            workshop: filter.workshop,
          },
        },
        {
          $sort: {
            updatedAt: -1, // Ordena por la placa del vehículo en orden descendente
          },
        },
      ])
      .exec();
  }

  async anulateOrder(data: { id: string; comment: string }) {
    console.log('service - data: ', data);

    const order = await this.repairOrderModel.updateOne(
      { _id: data.id },
      {
        status: StatusRepairOrder.Anulada,
        statusVehicle: StatusVehicle.NoSeTrabajo,
        anullationComment: data.comment,
      },
    );

    return order;
  }
}
