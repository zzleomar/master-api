import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { WorkshopsService } from '../workshops/workshops.service';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { ClientsService } from '../clients/clients.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { UsersService } from '../users/users.service';
import {
  Budget,
  StatusBudget,
  TypeBudget,
  TypeSupplement,
} from './entities/budget.entity';
import { InsurancesService } from '../insurances/insurances.service';
import { InspectionBudgetDto } from './dto/inspection-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { HistoriesService } from '../histories/histories.service';
import { CreateSupplementBudgetDto } from './dto/create-supplement-budget.dto';
import { codeBudget } from './utils/parseLabel';
import { filter, find, groupBy, map } from 'lodash';
import { RepairOrder } from '../repair-orders/entities/repair-order.entity';
import * as moment from 'moment-timezone';

export interface FindAllResponse {
  results: any[];
  total: number;
}
@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel('Budget') private readonly budgetModel: Model<any>,
    @InjectModel('RepairOrder') private readonly repairOrderModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly clientsService: ClientsService,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly insurancesService: InsurancesService,
    private readonly historiesService: HistoriesService,
  ) {
    moment.tz.setDefault('America/Panama');
  }

  async create(
    data: CreateBudgetDto,
    creationDate: any = null,
    oldCode: any = null,
  ): Promise<Budget> {
    const body: any = { ...data };
    await this.workshopsService.findOne(body.workshop);
    const owner = await this.clientsService.findOne(body.client);
    const vehicle = await this.vehiclesService.findOne(body.vehicle);
    const quoter = await this.usersService.findOne(body.quoter);
    const insurances = await this.insurancesService.findOne(
      body.insuranceCompany,
    );
    body.quoter = quoter;
    body.insuranceCompany = insurances;

    const createdBudge = new this.budgetModel(body);

    if (
      createdBudge.type &&
      createdBudge.type === 'Suplemento' &&
      !createdBudge.code
    ) {
      throw new BadRequestException(`code principal is requerid`);
    } else {
      createdBudge.code = oldCode ?? (await this.getLastCode());
    }
    createdBudge.clientData = owner.toObject();
    createdBudge.vehicleData = vehicle.toObject();
    createdBudge.insuranceData = insurances.toObject();
    createdBudge.statusChange = [
      {
        initDate: creationDate ?? new Date(moment().hours(12).toISOString()),
        endDate: null,
        status: 'Estimado',
      },
    ];
    createdBudge.creationDate =
      creationDate ?? new Date(moment().hours(12).toISOString());
    createdBudge.oldData = oldCode !== null;
    const budget = await createdBudge.save();
    return budget;
  }

  async findOne(id: string, error: boolean = true): Promise<any> {
    const budget = await this.budgetModel.findOne({ _id: id }).exec();

    if (!budget && error) {
      throw new NotFoundException(`Budge with id:${id} not found `);
    }
    return budget;
  }

  async findBy(filter: any, error: boolean = true): Promise<any[]> {
    const budget = await this.budgetModel
      .find({ ...filter })
      .populate(['vehicle', 'insuranceCompany', 'quoter'])
      .exec();

    if (!budget && budget.length === 0 && error) {
      throw new NotFoundException(
        `Budge with ${JSON.stringify(filter)} not found `,
      );
    }

    return budget;
  }

  async getLastCode(): Promise<number> {
    const lastBudget = await this.budgetModel.findOne(
      {},
      { code: 1 },
      { sort: { code: -1 } },
    );
    const lastCode = lastBudget ? lastBudget.code : 0; // Si no hay documentos, devuelve 0 como valor predeterminado.
    return lastCode + 1 > Number(process.env.BUDGET_INIT)
      ? lastCode + 1
      : Number(process.env.BUDGET_INIT); // Incrementa el último código encontrado en uno para obtener el nuevo código.
  }

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
    const query = this.budgetModel
      .find(filter)
      .populate(['vehicle', 'insuranceCompany', 'quoter']);
    const countQuery = this.budgetModel.countDocuments(filter);

    const results = await query
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    const total = await countQuery.exec();

    return { results, total };
  }

  async saveInspection(
    budgetData: Budget,
    data: InspectionBudgetDto,
    creationDate: any = null,
  ) {
    budgetData.inspection = {
      pieces: data.pieces,
      others: data.others,
      photos: data.photos,
      documents: data.documents,
      updated: creationDate ?? new Date(),
      created: creationDate ?? new Date(),
    };
    budgetData.comment = data.comment ?? '';
    budgetData.tax = data.tax ?? 0;

    await this.budgetModel.updateOne({ _id: budgetData._id }, budgetData);
    const budgetUpdate = await this.budgetModel
      .findById(budgetData._id)
      .populate(['vehicle', 'insuranceCompany', 'quoter'])
      .exec();
    const RO = await this.repairOrderModel
      .find({
        'budgetData._id': budgetUpdate._id,
      })
      .exec();

    if (RO.length > 0) {
      await this.updateInspection(RO[0], budgetUpdate);
    }
    return budgetUpdate;
  }

  async updateInspection(orderData: RepairOrder, dataBudgets: Budget) {
    const piecesNames = map(
      filter(
        dataBudgets.inspection.pieces,
        (item: any) =>
          item.operation === 'Cambiar' || item.operation === 'Cambiar y pintar',
      ),
      (item2: any) => item2.piece.name,
    );

    const newPieces = map(piecesNames, (piece: any) => {
      const old = find(orderData.pieces, (item: any) => item.piece === piece);
      return (
        old ?? {
          piece: piece,
          price: null,
          status: null,
          receptionDate: null,
          provider: null,
          comment: null,
        }
      );
    });
    const budget = await this.findBy({
      _id: orderData.budgetData._id,
    });
    await this.repairOrderModel.updateOne(
      { _id: orderData._id },
      { pieces: newPieces, budgetData: budget[0].toObject() },
    );
  }

  async updateStatus(
    budgetData: Budget,
    statusNew: StatusBudget,
    statusLast: StatusBudget,
    user: any,
    creationDate: any = null,
  ) {
    const now = creationDate ?? new Date();
    const oldStatus = budgetData.status;
    budgetData.status = statusNew;
    const itemKeyChange = budgetData.statusChange.findIndex(
      (item: any) => item.status === statusLast,
    );
    if (itemKeyChange !== undefined && itemKeyChange !== null) {
      budgetData.statusChange[itemKeyChange].endDate = now;
    }
    budgetData.statusChange.push({
      initDate: now,
      endDate: null,
      status: statusNew,
    });
    await this.budgetModel.updateOne({ _id: budgetData._id }, budgetData);

    await this.historiesService.createHistory({
      message: `Cambió estado del presupuesto ${codeBudget(
        budgetData,
      )} de ${oldStatus} a ${statusNew}`,
      user: user._id,
      budget: budgetData._id,
    });
    return budgetData;
  }

  async update(id: string, data: UpdateBudgetDto): Promise<any> {
    const body: any = { ...data };
    await this.workshopsService.findOne(body.workshop);
    const owner = await this.clientsService.findOne(body.client);
    const vehicle = await this.vehiclesService.findOne(body.vehicle);
    const quoter = await this.usersService.findOne(body.quoter);
    const insurances = await this.insurancesService.findOne(
      body.insuranceCompany,
    );
    body.quoter = new Types.ObjectId(quoter._id);
    body.insuranceCompany = new Types.ObjectId(insurances._id);
    body.clientData = owner.toObject();
    body.vehicleData = vehicle.toObject();
    body.insuranceData = insurances.toObject();
    delete body.vehicle;
    delete body.client;

    if (body.creationDate) {
      const newDate = new Date(
        moment(
          body.creationDate + ' 12:00:00',
          'DD/MM/YYYY HH:mm:ss',
        ).toISOString(),
      );

      body.creationDate = newDate;

      const budgetByUpdate = await this.budgetModel.findById(id);
      const index = budgetByUpdate.statusChange.findIndex(
        (item: any) =>
          item.endDate === null && ['Esp. Aprob.'].includes(item.status),
      );
      if (index >= 0 && budgetByUpdate.statusChange[index]) {
        body.statusChange = {
          ...budgetByUpdate.statusChange[index],
          initDate: newDate,
        };
      }
    }

    await this.budgetModel.updateOne({ _id: id }, { $set: body });
    const updatedBudget = await this.budgetModel.findById(id);

    return updatedBudget;
  }

  async findBudgetsByFilter(
    filter: any,
    value: any,
    page: number = 1,
    pageSize: number = 30,
  ): Promise<FindAllResponse> {
    const totalDocs = await this.budgetModel
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
      ])
      .exec();
    const [results, total] = await Promise.all([
      this.budgetModel
        .aggregate([
          {
            $lookup: {
              from: 'vehicles', // Nombre de la colección Vehicle
              localField: 'vehicle', // Campo en Budget que hace referencia a Vehicle
              foreignField: '_id', // Campo en Vehicle que se relaciona con Budget
              as: 'vehicle',
            },
          },
          {
            $lookup: {
              from: 'insurances', // Nombre de la colección Insurance
              localField: 'insuranceCompany',
              foreignField: '_id',
              as: 'insuranceCompany',
            },
          },
          {
            $lookup: {
              from: 'users', // Nombre de la colección User
              localField: 'quoter',
              foreignField: '_id',
              as: 'quoter',
            },
          },
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
            $unwind: '$vehicle', // Desagrupa el resultado del $lookup de Vehicle
          },
          {
            $unwind: '$insuranceCompany', // Desagrupa el resultado del $lookup de Insurance
          },
          {
            $unwind: '$quoter', // Desagrupa el resultado del $lookup de User
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
        .exec(),
      totalDocs.length,
    ]);

    return { results, total };
  }

  async expited(budgetData: Budget, diff: number) {
    const expitedDate = moment().subtract(diff, 'days');
    const itemKeyChange = budgetData.statusChange.findIndex(
      (item: any) => item.status === StatusBudget.Espera,
    );
    if (itemKeyChange !== undefined && itemKeyChange !== null) {
      budgetData.statusChange[itemKeyChange].initDate = expitedDate.toDate();
    }
    await this.budgetModel.updateOne({ _id: budgetData._id }, budgetData);
  }

  async createSupplement(
    budgetData: Budget,
    data: CreateSupplementBudgetDto,
    numberSupplement: number = null,
    creationDate: any = null,
  ) {
    let budgets: any = [];
    if (creationDate === null) {
      budgets = await this.findBy({
        code: budgetData.code,
        type: 'Suplemento',
        typeSupplement: data.typeSupplement,
      });
    }
    if (
      (data.typeSupplement === TypeSupplement.A && budgets.length < 3) ||
      (data.typeSupplement === TypeSupplement.M && budgets.length < 2) ||
      (data.typeSupplement === TypeSupplement.O && budgets.length < 1)
    ) {
      const budgetNew = new this.budgetModel(budgetData.toObject());
      budgetNew._id = new Types.ObjectId();
      budgetNew.comment = '';
      budgetNew.inspection = undefined;
      budgetNew.history = undefined;

      budgetNew.quoter = budgetData.quoter;
      budgetNew.insuranceCompany = budgetData.insuranceCompany;
      budgetNew.vehicle = budgetData.vehicle;
      budgetNew.updatedAt = new Date();
      budgetNew.creationDate = creationDate ?? moment().toISOString();
      budgetNew.status = StatusBudget.Estimado;
      budgetNew.type = TypeBudget.Suplemento;
      budgetNew.typeSupplement = data.typeSupplement;
      budgetNew.numberSupplement = numberSupplement ?? budgets.length;
      budgetNew.statusChange = [
        {
          initDate: creationDate ?? new Date(),
          endDate: null,
          status: StatusBudget.Estimado,
        },
      ];
      return await budgetNew.save();
    } else {
      return null;
    }
  }

  async reportQuoterBudgetExpired(
    initDate: any,
    endDate: any,
    type: string,
    user: any = null,
  ) {
    let filterMatch: any = {
      $or: [
        {
          type: 'Principal',
          status: StatusBudget.Expirado,
        },
        {
          type: 'Principal',
          status: StatusBudget.Espera,
          statusChange: {
            $elemMatch: {
              status: StatusBudget.Espera,
              initDate:
                type === 'today'
                  ? { $exists: true }
                  : {
                      $lt: endDate,
                    },
            },
          },
        },
      ],
    };
    if (user && user.role === 'Cotizador') {
      filterMatch = {
        $or: [
          {
            quoter: new Types.ObjectId(user._id),
            type: 'Principal',
            status: StatusBudget.Expirado,
          },
          {
            quoter: new Types.ObjectId(user._id),
            type: 'Principal',
            status: StatusBudget.Espera,
            statusChange: {
              $elemMatch: {
                status: StatusBudget.Espera,
                initDate:
                  type === 'today'
                    ? { $exists: true }
                    : {
                        $lt: endDate,
                      },
              },
            },
          },
        ],
      };
    }
    const docs = await this.budgetModel
      .aggregate([
        {
          $match: filterMatch,
        },
      ])
      .exec();
    const result = filter(docs, (doc: Budget) => {
      let diff = 60;
      if (doc.insuranceData.name === 'Particular') {
        diff = 30;
      }
      const itemChange = find(
        doc.statusChange,
        (item: any) => item.status === StatusBudget.Espera,
      );
      // fecha en la que quedo expirado el presupuesto
      const expitedValidateToday = moment()
        .tz('America/Panama')
        .add(diff, 'days');
      const expitedValidateInit = moment(itemChange.initDate).add(diff, 'days');
      // fecha final en la que el presupuesto esta expirado y entra en el reporte
      const expitedValidateEnd = expitedValidateInit.clone();
      expitedValidateEnd.add(
        moment(endDate).diff(moment(initDate), 'days'),
        'days',
      );

      return (
        doc.status === StatusBudget.Expirado ||
        (expitedValidateInit.isSameOrBefore(moment(initDate)) &&
          expitedValidateEnd.isSameOrAfter(moment(endDate))) ||
        (type === 'today' &&
          expitedValidateInit.isSameOrAfter(expitedValidateToday))
      );
    });
    // Agrupar por insuranceCompany y quoter
    const groupedData = groupBy(
      result,
      (item) => `${item.insuranceCompany._id}-${item.quoter._id}`,
    );

    // Mapear los resultados a la forma deseada
    const results = Object.keys(groupedData).map((key) => {
      const [insuranceCompany, quoter] = key.split('-');
      return {
        insurance: new mongoose.Types.ObjectId(insuranceCompany),
        quoter: new mongoose.Types.ObjectId(quoter),
        total: groupedData[key].length,
      };
    });
    return results;
  }

  async reportQuoterBudgetSubmissions(
    initDate: any,
    endDate: any,
    type: string,
    user: any = null,
  ) {
    let filterMatch: any = {
      type: 'Principal',
      status: StatusBudget.Espera,
      statusChange: {
        $elemMatch: {
          status: StatusBudget.Espera,
          initDate:
            type === 'today'
              ? { $exists: true }
              : { $gte: initDate, $lte: endDate },
        },
      },
    };
    if (user && user.role === 'Cotizador') {
      filterMatch = {
        type: 'Principal',
        status: StatusBudget.Espera,
        quoter: new Types.ObjectId(user._id),
        statusChange: {
          $elemMatch: {
            status: StatusBudget.Espera,
            initDate:
              type === 'today'
                ? { $exists: true }
                : { $gte: initDate, $lte: endDate },
          },
        },
      };
    }
    const docs = await this.budgetModel
      .aggregate([
        {
          $match: filterMatch,
        },
      ])
      .exec();
    const result = filter(docs, (doc: Budget) => {
      let diff = 60;
      if (doc.insuranceData.name === 'Particular') {
        diff = 30;
      }
      const itemChange = find(
        doc.statusChange,
        (item: any) => item.status === StatusBudget.Espera,
      );
      // fecha en la que quedo expirado el presupuesto
      const expitedValidateInit = moment(itemChange.initDate).add(diff, 'days');
      // fecha final en la que el presupuesto esta expirado y entra en el reporte
      const expitedValidateEnd = expitedValidateInit.clone();
      expitedValidateEnd.add(
        moment(endDate).diff(moment(initDate), 'days'),
        'days',
      );

      return (
        expitedValidateInit.isAfter(moment(endDate)) ||
        (type === 'today' && expitedValidateInit.isAfter(moment()))
      );
    });
    // Agrupar por insuranceCompany y quoter
    const groupedData = groupBy(
      result,
      (item) => `${item.insuranceCompany._id}-${item.quoter._id}`,
    );

    // Mapear los resultados a la forma deseada
    const results = Object.keys(groupedData).map((key) => {
      const [insuranceCompany, quoter] = key.split('-');
      return {
        insurance: new mongoose.Types.ObjectId(insuranceCompany),
        quoter: new mongoose.Types.ObjectId(quoter),
        total: groupedData[key].length,
      };
    });
    return results;
  }
}
