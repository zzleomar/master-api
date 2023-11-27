import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { WorkshopsService } from '../workshops/workshops.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import * as moment from 'moment';
import { CreateSupplementBudgetDto } from './dto/create-supplement-budget.dto';

export interface FindAllResponse {
  results: any[];
  total: number;
}
@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel('Budget') private readonly budgetModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly clientsService: ClientsService,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly insurancesService: InsurancesService,
    private readonly historiesService: HistoriesService,
  ) {}

  async create(data: CreateBudgetDto): Promise<Budget> {
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
      createdBudge.code = await this.getLastCode();
    }
    createdBudge.clientData = owner.toObject();
    createdBudge.vehicleData = vehicle.toObject();
    createdBudge.insuranceData = insurances.toObject();
    createdBudge.statusChange = [
      {
        initDate: new Date(),
        endDate: null,
        status: 'Estimado',
      },
    ];
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
    return lastCode + 1; // Incrementa el último código encontrado en uno para obtener el nuevo código.
  }

  async findAll(
    filter: any,
    page: number = 1,
    pageSize: number = 30,
  ): Promise<FindAllResponse> {
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

  async saveInspection(budgetData: Budget, data: InspectionBudgetDto) {
    budgetData.inspection = {
      pieces: data.pieces,
      others: data.others,
      photos: data.photos,
      documents: data.documents,
      updated: new Date(),
      created: new Date(),
    };
    budgetData.comment = data.comment ?? '';
    budgetData.tax = data.tax ?? 0;

    await budgetData.save();

    return budgetData;
  }

  async updateStatus(
    budgetData: Budget,
    statusNew: StatusBudget,
    statusLast: StatusBudget,
    user: any,
  ) {
    const now = new Date();
    budgetData.status = statusNew;
    const itemKeyChange = budgetData.statusChange.findIndex(
      (item: any) => item.status === statusLast,
    );
    if (itemKeyChange !== undefined && itemKeyChange !== null) {
      budgetData.statusChange[itemKeyChange].endDate = now;
    }
    budgetData.statusChange.push({
      initDate: new Date(),
      endDate: null,
      status: statusNew,
    });
    await this.budgetModel.updateOne({ _id: budgetData._id }, budgetData);

    await this.historiesService.createHistory({
      message: `Cambio de estado del presupuesto ${budgetData.code
        .toString()
        .padStart(6, '0')} a ${budgetData.status} a ${StatusBudget.Espera}`,
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
    await this.budgetModel.updateOne({ _id: id }, body);
    const updatedBudget = this.budgetModel.findById(id);
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

  async createSupplement(budgetData: Budget, data: CreateSupplementBudgetDto) {
    const budgets = await this.findBy({
      code: budgetData.code,
      type: 'Suplemento',
      typeSupplement: data.typeSupplement,
    });
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
      budgetNew.status = StatusBudget.Estimado;
      budgetNew.type = TypeBudget.Suplemento;
      budgetNew.typeSupplement = data.typeSupplement;
      budgetNew.numberSupplement = budgets.length;
      budgetNew.statusChange = [
        {
          initDate: new Date(),
          endDate: null,
          status: StatusBudget.Estimado,
        },
      ];
      return await budgetNew.save();
    } else {
      return null;
    }
  }
}
