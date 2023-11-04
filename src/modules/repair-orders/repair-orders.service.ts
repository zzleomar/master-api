import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRepairOrderDto } from './dto/create-repair-order.dto';
import { Budget } from '../budgets/entities/budget.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { filter, map } from 'lodash';
import { HistoriesService } from '../histories/histories.service';

@Injectable()
export class RepairOrdersService {
  constructor(
    @InjectModel('RepairOrder') private readonly repairOrderModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly historiesService: HistoriesService,
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
            item.operation === 'cambiar' ||
            item.operation === 'cambiar y pintar',
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

      const createdOrder = new this.repairOrderModel(body);
      createdOrder.budget = new Types.ObjectId(dataBudgets._id);
      createdOrder.budgetData = dataBudgets.toObject();
      createdOrder.code = await this.getLastCode();

      createdOrder.pieces = pieces;
      //si la orden de compra esta aprobada y el carro esta en el taller
      if (createRepairOrderDto.approved && createRepairOrderDto.inTheWorkshop) {
        if (pieces.length === 0) {
          createdOrder.statusVehicle = 'Esperando turno'; //TODO falta confirmar este estado en este punto
        } else {
          createdOrder.statusVehicle = 'Esperando piezas';
        }
      }

      //si la orden de compra esta aprobada y el carro no esta en el taller
      if (
        createRepairOrderDto.approved &&
        !createRepairOrderDto.inTheWorkshop
      ) {
        if (pieces.length === 0) {
          createdOrder.statusVehicle = 'Esperando cliente';
        } else {
          createdOrder.statusVehicle = 'Esperando piezas';
        }
      }

      //si la orden de compra no esta aprobada y el carro esta en el taller
      if (
        !createRepairOrderDto.approved &&
        createRepairOrderDto.inTheWorkshop
      ) {
        createdOrder.statusVehicle = 'Esperando aprobación';
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
        budget: createdOrder.id,
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
}
