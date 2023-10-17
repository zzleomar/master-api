import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { WorkshopsService } from '../workshops/workshops.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientsService } from '../clients/clients.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { UsersService } from '../users/users.service';
import { Budget } from './entities/budget.entity';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel('Budget') private readonly budgetModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly clientsService: ClientsService,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
  ) {}

  async create(body: CreateBudgetDto): Promise<Budget> {
    await this.workshopsService.findOne(body.workshop);
    const owner = await this.clientsService.findOne(body.client);
    await this.vehiclesService.findOne(body.vehicle);
    await this.usersService.findOne(body.quoter);

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
    createdBudge.statusChange = [
      {
        initDate: new Date(),
        endDate: null,
        status: 'Espera',
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

  async getLastCode(): Promise<number> {
    const lastBudget = await this.budgetModel.findOne(
      {},
      { code: 1 },
      { sort: { code: -1 } },
    );
    const lastCode = lastBudget ? lastBudget.code : 0; // Si no hay documentos, devuelve 0 como valor predeterminado.
    return lastCode + 1; // Incrementa el último código encontrado en uno para obtener el nuevo código.
  }

  async findAll(filter: any): Promise<any[]> {
    return this.budgetModel
      .find(filter)
      .populate(['vehicle', 'insuranceCompany', 'quoter'])
      .exec();
  }

  async findBudgetsByPlate(filter: any, value: string): Promise<any[]> {
    return this.budgetModel
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
            'vehicle.plate': { $regex: value },
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
      ])
      .exec();
  }
}
