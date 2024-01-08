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
import { filter, find, map } from 'lodash';
import { HistoriesService } from '../histories/histories.service';
import { StatusRepairOrderstDto } from './dto/status-order.dto';
import { StatusRepairOrder } from './entities/repair-order.entity';
import { RepairOrder, StatusVehicle } from './entities/repair-order.entity';
import { BudgetsService, FindAllResponse } from '../budgets/budgets.service';
import { PiecesOrderDto } from './dto/pieces-order.dto';
import { InitOTDto } from './dto/init-OT-order.dto';
import * as moment from 'moment-timezone';
import { MovementsRepairOrderDto } from './dto/movements-repair-order.dto';
import { codeRO } from './utils/parseLabel';
import { codeBudget } from '../budgets/utils/parseLabel';
@Injectable()
export class RepairOrdersService {
  constructor(
    @InjectModel('RepairOrder') private readonly repairOrderModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly historiesService: HistoriesService,
    private readonly budgetsSevice: BudgetsService,
  ) {
    moment.tz.setDefault('America/Panama');
  }

  async create(
    createRepairOrderDto: CreateRepairOrderDto,
    dataBudgets: Budget,
    user: any,
    oldCode: number = null,
    creationDate: any = null,
    statusAux: boolean = false,
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
      if (dataBudgets.type === 'Suplemento') {
        const orderPrincipal = await this.findBy({
          workshop: new Types.ObjectId(user.workshop),
          'budgetData.code': dataBudgets.code,
          'budgetData.type': 'Principal',
        });
        if (orderPrincipal.length > 0) {
          createdOrder.code = orderPrincipal[0].code;
        } else {
          throw new BadRequestException(
            `No se encontro la orden Madre del suplemento ${dataBudgets.code}`,
          );
        }
      } else {
        createdOrder.code = oldCode ?? (await this.getLastCode());
      }

      createdOrder.pieces = pieces;
      //si la orden de compra esta aprobada y el carro esta en el taller
      if (createRepairOrderDto.approved && createRepairOrderDto.inTheWorkshop) {
        if (
          (pieces.length === 0 && !statusAux) ||
          (oldCode !== null && !statusAux)
        ) {
          createdOrder.statusVehicle = StatusVehicle.EsperandoTurno;
        } else {
          createdOrder.statusVehicle = StatusVehicle.EsperandoPieza;
        }
        await this.budgetsSevice.updateStatus(
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
        await this.budgetsSevice.updateStatus(
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
          initDate: creationDate ?? new Date(),
          endDate: null,
          status: createdOrder.statusVehicle,
        },
      ];
      createdOrder.statusChange = [
        {
          initDate: creationDate ?? new Date(),
          endDate: null,
          status: 'Abierta',
        },
      ];

      const dataBudgets2 = await this.budgetsSevice.findBy({
        _id: new Types.ObjectId(dataBudgets._id),
      });

      createdOrder.budgetData = dataBudgets2[0].toObject();
      const order = await createdOrder.save();

      await this.historiesService.createHistory({
        message: `Convirtió el presupuesto ${codeBudget(
          dataBudgets,
        )} en una RO`,
        user: user._id,
        budget: dataBudgets._id,
      });

      await this.historiesService.createHistory({
        message: `Generó la RO ${codeRO(order)} con el estado ${
          order.statusVehicle
        }`,
        user: user._id,
        ro: createdOrder.id,
      });

      return order;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async updateInspection(orderData: RepairOrder, dataBudgets: Budget) {
  //   const piecesNames = map(
  //     filter(
  //       dataBudgets.inspection.pieces,
  //       (item: any) =>
  //         item.operation === 'Cambiar' || item.operation === 'Cambiar y pintar',
  //     ),
  //     (item2: any) => item2.piece.name,
  //   );

  //   const piecesOld = orderData.pieces;
  //   const piecesOldNames = map(orderData.pieces, (piece: any) => piece.name);

  //   const pieces = filter(piecesOld, (piece: any) =>
  //     piecesNames.includes(piece.piece),
  //   );
  //   const newPieces = filter(piecesNames, (piece: any) =>
  //     piecesOldNames.includes(piece),
  //   );

  //   if (newPieces.length > 0) {
  //     for (let i = 0; i < newPieces.length; i++) {
  //       pieces.push({
  //         piece: newPieces[i],
  //         price: null,
  //         status: null,
  //         receptionDate: null,
  //         provider: null,
  //         comment: null,
  //       });
  //     }
  //   }

  //   const budget = await this.budgetsSevice.findBy({
  //     _id: orderData.budgetData._id,
  //   });
  //   await this.repairOrderModel.updateOne(
  //     { _id: orderData._id },
  //     { pieces, budgetData: budget[0].toObject() },
  //   );
  // }

  async findAll(
    filterData: any,
    page: number = 1,
    pageSize: number = 30,
    statusTab: string = 'all',
  ): Promise<FindAllResponse> {
    let filter: any = {};
    if (statusTab === 'all') {
      filter = { ...filterData };
    } else {
      filter = { ...filterData };
      filter.status = statusTab;
    }
    const totalDocs = await this.repairOrderModel
      .aggregate([
        {
          $match: {
            ...filter,
          },
        },
      ])
      .exec();

    const results = await this.repairOrderModel
      .aggregate([
        {
          $lookup: {
            from: 'users', // Nombre de la colección User
            localField: 'budgetData.quoter._id',
            foreignField: '_id',
            as: 'budgetData.quoter',
          },
        },
        {
          $match: {
            ...filter,
          },
        },
        {
          $unwind: '$budgetData.quoter', // Desagrupa el resultado del $lookup de User
        },
        {
          $sort: {
            updatedAt: -1, // Ordena por la placa del vehículo en orden descendente
          },
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
      ])
      .exec();
    return { results, total: totalDocs.length };
  }

  async getLastCode(): Promise<number> {
    const lastOrder = await this.repairOrderModel.findOne(
      {},
      { code: 1 },
      { sort: { code: -1 } },
    );
    const lastCode = lastOrder ? lastOrder.code : 0; // Si no hay documentos, devuelve 0 como valor predeterminado.
    return lastCode + 1 > Number(process.env.RO_INIT)
      ? lastCode + 1
      : Number(process.env.RO_INIT); // Incrementa el último código encontrado en uno para obtener el nuevo código.
  }

  async findBy(filter: any, error: boolean = true): Promise<RepairOrder[]> {
    const repairOrder = await this.repairOrderModel.find({ ...filter }).exec();

    if (!repairOrder && repairOrder.length === 0 && error) {
      throw new NotFoundException(
        `repairOrders with ${JSON.stringify(filter)} not found `,
      );
    }

    return repairOrder;
  }

  async findByCount(filter: any): Promise<number> {
    const repairOrder = await this.repairOrderModel
      .countDocuments({ ...filter })
      .exec();
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
            dataRO.pieces.length > 0
              ? StatusVehicle.EsperandoPieza
              : StatusVehicle.EsperandoTurno,
            dataRO.statusVehicle,
            {
              approved: data.approved,
            },
          );
          let dataBudgets = await this.budgetsSevice.findBy({
            _id: dataRO.budgetData._id,
          });
          await this.budgetsSevice.updateStatus(
            dataBudgets[0],
            StatusBudget.Aprobado,
            StatusBudget.Espera,
            user,
          );
          dataBudgets = await this.budgetsSevice.findBy({
            _id: dataRO.budgetData._id,
          });
          await this.repairOrderModel.updateOne(
            { _id: dataRO._id },
            { budgetData: dataBudgets[0].toObject() },
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
      (item: any) => item.status === statusLast && item.endDate == null,
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
    if (statusNew === StatusVehicle.Terminado) {
      await this.changeStatusOrder(
        { id: dataRO._id },
        dataRO,
        StatusRepairOrder.Completada,
      );
    }

    return dataRO;
  }

  async findOrderByFilter(
    filter: any,
    value: any,
    page: number = 1,
    pageSize: number = 30,
  ): Promise<FindAllResponse> {
    let totalDocs: any[] = [];
    let results: any[] = [];
    if (page === 0) {
      totalDocs = await this.repairOrderModel
        .aggregate([
          {
            $lookup: {
              from: 'users', // Nombre de la colección User
              localField: 'budgetData.quoter._id',
              foreignField: '_id',
              as: 'budgetData.quoter',
            },
          },
          {
            $match: {
              ...filter,
              [value.label]:
                typeof value.value === 'string'
                  ? { $regex: value.value, $options: 'i' }
                  : value.value,
            },
          },
          {
            $unwind: '$budgetData.quoter', // Desagrupa el resultado del $lookup de User
          },
          {
            $sort: {
              updatedAt: -1, // Ordena por la placa del vehículo en orden descendente
            },
          },
        ])
        .exec();
      results = totalDocs;
    } else {
      totalDocs = await this.repairOrderModel
        .aggregate([
          {
            $match: {
              ...filter,
              [value.label]:
                typeof value.value === 'string'
                  ? { $regex: value.value, $options: 'i' }
                  : value.value,
            },
          },
        ])
        .exec();
      results = await this.repairOrderModel
        .aggregate([
          {
            $lookup: {
              from: 'users', // Nombre de la colección User
              localField: 'budgetData.quoter._id',
              foreignField: '_id',
              as: 'budgetData.quoter',
            },
          },
          {
            $match: {
              ...filter,
              [value.label]:
                typeof value.value === 'string'
                  ? { $regex: value.value, $options: 'i' }
                  : value.value,
            },
          },
          {
            $unwind: '$budgetData.quoter', // Desagrupa el resultado del $lookup de User
          },
          {
            $sort: {
              updatedAt: -1, // Ordena por la placa del vehículo en orden descendente
            },
          },
          {
            $skip: (page - 1) * pageSize,
          },
          {
            $limit: pageSize,
          },
        ])
        .exec();
    }
    return { results, total: totalDocs.length };
  }

  async changeStatusOrder(
    data: { id: string; comment?: string },
    dataRO: RepairOrder,
    newStatus: StatusRepairOrder = StatusRepairOrder.Anulada,
    creationDate: any = null,
  ) {
    const statusChange = dataRO.statusChange;
    const statusVehicleChange = dataRO.statusChangeVehicle;
    const now = creationDate ?? new Date();
    const itemKeyChange = statusChange.findIndex(
      (item: any) =>
        item.status === StatusRepairOrder.Abierta && item.endDate == null,
    );
    if (itemKeyChange !== undefined && itemKeyChange !== null) {
      statusChange[itemKeyChange].endDate = now;
    }
    statusChange.push({
      initDate: creationDate ?? new Date(),
      endDate: null,
      status: newStatus,
    });

    const itemKeyChangeVehicle = statusVehicleChange.findIndex(
      (item: any) => item.endDate == null,
    );
    if (
      newStatus == StatusRepairOrder.Anulada &&
      itemKeyChangeVehicle !== undefined &&
      itemKeyChangeVehicle !== null
    ) {
      statusVehicleChange[itemKeyChange].endDate = now;
      statusVehicleChange.push({
        initDate: creationDate ?? new Date(),
        endDate: null,
        status: StatusVehicle.NoSeTrabajo,
      });
    }
    await this.repairOrderModel.updateOne(
      { _id: data.id },
      {
        statusChange,
        statusVehicleChange,
        status: newStatus,
        statusVehicle:
          newStatus === StatusRepairOrder.Anulada
            ? StatusVehicle.NoSeTrabajo
            : undefined,
        anullationComment:
          newStatus === StatusRepairOrder.Anulada ? data.comment : undefined,
        anullationDate:
          newStatus === StatusRepairOrder.Anulada
            ? moment(creationDate ?? new Date()).format('DD/MM/YYYY')
            : undefined,
      },
    );

    return this.repairOrderModel.findById({ _id: data.id });
  }

  async savePieces(order: RepairOrder, data: PiecesOrderDto) {
    order.pieces = [...data.pieces];
    order.save();
    return order;
  }

  async generateOT(order: RepairOrder, data: InitOTDto, initDate: any = null) {
    order.initOT = initDate ?? new Date();
    order.endOT = moment(data.endDate, 'DD/MM/YYYY').toDate();
    order.save();
    return order;
  }

  async updateBudget(order: RepairOrder, budget: Budget) {
    await budget.populate(['vehicle', 'insuranceCompany', 'quoter']);
    await this.repairOrderModel.updateOne(
      { _id: order.id },
      {
        budgetData: budget.toObject(),
      },
    );

    return this.repairOrderModel.findById({ _id: order.id });
  }

  async changeMovements(
    orders: RepairOrder[],
    data: MovementsRepairOrderDto,
    user: any,
  ) {
    let response: RepairOrder[] | Promise<RepairOrder>[] = map(
      orders,
      async (order: RepairOrder) => {
        const item = find(
          data.movements,
          (movement: any) => movement.id === order.id,
        );

        if (order.budgetData.type === 'Principal') {
          const roSumplemnts = await this.findBy({
            workshop: new Types.ObjectId(order.workshop),
            'budgetData.code': order.budgetData.code,
            'budgetData.type': 'Suplemento',
            initOT: { $ne: null },
          });

          if (roSumplemnts.length > 0) {
            this.changeMovements(
              roSumplemnts,
              {
                movements: roSumplemnts.map((item2: RepairOrder) => {
                  return {
                    id: item2.id,
                    statusInput: item.statusInput,
                  };
                }),
              },
              user,
            );
            let response = [];

            for (let i = 0; i < roSumplemnts.length; i++) {
              const ro = roSumplemnts[i];
              response.push(
                await this.historiesService.createHistory({
                  message: `Editó datos del vehiculo en la RO ${codeRO(ro)}`,
                  user: user._id,
                  ro: ro.id,
                }),
              );
            }
            response = await Promise.all(response);
          }
        }

        return this.updateStatusVehicle(
          order,
          item.statusInput,
          order.statusVehicle,
          {},
        );
      },
    );
    response = await Promise.all(response);
    return response;
  }

  async updateOne(filter: any, data: any) {
    return this.repairOrderModel.updateOne(filter, data);
  }

  async reportInsurance(initDate: any, endDate: any) {
    const result = await this.repairOrderModel
      .aggregate([
        {
          $match: {
            'budgetData.type': 'Principal',
            'budgetData.statusChange': {
              $elemMatch: {
                status: StatusBudget.Espera,
                endDate: { $gte: initDate, $lte: endDate, $ne: null },
              },
            },
          },
        },
        {
          $group: {
            _id: '$budgetData.insuranceCompany',
            total: { $sum: 1 },
          },
        },
      ])
      .exec();

    return result;
  }

  async reportQuoterCompleted(
    initDate: any,
    endDate: any,
    type: string = 'today',
    user: any = null,
  ) {
    let filterMatch: any = {
      'budgetData.type': 'Principal',
      'budgetData.statusChange': {
        $elemMatch: {
          status: StatusBudget.Aprobado,
          initDate:
            type === 'today'
              ? { $exists: true }
              : { $gte: initDate, $lte: endDate },
        },
      },
    };
    if (user && user.role === 'Cotizador') {
      filterMatch = {
        'budgetData.type': 'Principal',
        'budgetData.quoter._id': new Types.ObjectId(user._id),
        'budgetData.statusChange': {
          $elemMatch: {
            status: StatusBudget.Aprobado,
            initDate:
              type === 'today'
                ? { $exists: true }
                : { $gte: initDate, $lte: endDate },
          },
        },
      };
    }
    const result = await this.repairOrderModel
      .aggregate([
        {
          $match: filterMatch,
        },
        {
          $group: {
            _id: {
              insurance: '$budgetData.insuranceCompany._id', // Nombre de la aseguradora
              quoter: '$budgetData.quoter._id', // Nombre del cotizador
            },
            total: { $sum: 1 },
          },
        },
      ])
      .exec();

    return result;
  }

  async autopartsMapping(orders: RepairOrder[]) {
    return filter(orders, (item: RepairOrder) => {
      const result = find(item.pieces, (itemP: any) => {
        return itemP.status === null || itemP.status === 'Pedido';
      });
      return item.pieces.length > 0 && result !== undefined;
    });
  }

  async autoparts(filter: any, value: any): Promise<any[]> {
    const data = await this.repairOrderModel
      .aggregate([
        {
          $lookup: {
            from: 'users', // Nombre de la colección User
            localField: 'budgetData.quoter._id',
            foreignField: '_id',
            as: 'budgetData.quoter',
          },
        },
        {
          $match: {
            ...filter,
            [value.label]:
              typeof value.value === 'string'
                ? { $regex: value.value, $options: 'i' }
                : value.value,
          },
        },
        {
          $unwind: '$budgetData.quoter', // Desagrupa el resultado del $lookup de User
        },
        {
          $sort: {
            updatedAt: -1, // Ordena por la placa del vehículo en orden descendente
          },
        },
      ])
      .exec();
    return this.autopartsMapping(data);
  }

  async generateWarranty(ro: any, data: any, user: any) {
    if (data.mode === 'new') {
      const orderData = await this.findBy({
        workshop: new Types.ObjectId(user.workshop),
        code: ro.code,
        status: StatusRepairOrder.Garantia,
      });

      const newOrderWarranty = new this.repairOrderModel(
        JSON.parse(JSON.stringify(ro.toObject())),
      );

      newOrderWarranty._id = new Types.ObjectId();
      newOrderWarranty.masterRo = ro._id;
      newOrderWarranty.workshop = new Types.ObjectId(user.workshop);
      newOrderWarranty.budget = new Types.ObjectId(newOrderWarranty.budget);
      newOrderWarranty.budgetData.quoter._id = new Types.ObjectId(
        newOrderWarranty.budgetData.quoter._id,
      );

      newOrderWarranty.numberWarranty = orderData.length;
      newOrderWarranty.status = StatusRepairOrder.Garantia;
      newOrderWarranty.statusVehicle = StatusVehicle.TGarantia;
      newOrderWarranty.statusChangeVehicle = [
        {
          initDate: new Date(),
          endDate: null,
          status: newOrderWarranty.statusVehicle,
        },
      ];

      newOrderWarranty.statusChange = [
        {
          initDate: new Date(),
          endDate: null,
          status: newOrderWarranty.status,
        },
      ];

      newOrderWarranty.createdAt = new Date();
      newOrderWarranty.initOT = new Date(moment().hours(12).toISOString());
      newOrderWarranty.endOT = new Date(
        moment(data.endDate, 'DD/MM/YYYY').hours(13).toISOString(),
      );

      newOrderWarranty.initWarranty = new Date(
        moment().hours(12).toISOString(),
      );
      newOrderWarranty.endWarranty = new Date(
        moment(data.endDate, 'DD/MM/YYYY').hours(13).toISOString(),
      );

      newOrderWarranty.commentWarranty = data.commentWarranty;
      await newOrderWarranty.save();
      return newOrderWarranty;
    } else {
      const orderData = await this.findBy({
        workshop: new Types.ObjectId(user.workshop),
        _id: new Types.ObjectId(data.id),
        status: StatusRepairOrder.Garantia,
      });

      if (orderData.length > 0) {
        orderData[0].endWarranty = new Date(
          moment(data.endDate, 'DD/MM/YYYY').hours(13).toISOString(),
        );
        orderData[0].commentWarranty = data.commentWarranty;
        return await orderData[0].save();
      } else {
        throw new BadRequestException(
          'No se encuentra la garantia que desea editar',
        );
      }
    }
  }
}
