import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Insurance } from './entities/insurance.entity';

@Injectable()
export class InsurancesService {
  constructor(
    @InjectModel('Insurance') private readonly insuranceModel: Model<any>,
  ) {}

  async create(insurancesData: any): Promise<Insurance> {
    const createdInsurance = new this.insuranceModel(insurancesData);
    return createdInsurance.save();
  }

  async createMany(data: any[]): Promise<Insurance[]> {
    const createdInsurance = await this.insuranceModel.create(data);
    return createdInsurance;
  }

  /* async findAll(): Promise<Insurance[]> {
    return this.insuranceModel
      .find()
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .exec();
  } */

  async findAll(
    filter: any = {},
    page: number = 0,
    pageSize: number = 30,
  ): Promise<any> {
    if (page === 0) {
      return this.insuranceModel
        .find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ side: 1, name: 1 })
        .exec();
    } else {
      const countQuery = this.insuranceModel.countDocuments(filter);
      const results = await this.insuranceModel
        .find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ side: 1, name: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec();
      const total = await countQuery.exec();
      return { results, total };
    }
  }

  async findOne(id: string): Promise<Insurance | null> {
    return this.insuranceModel.findById(id).exec();
  }

  async update(id: string, insurancesData: any): Promise<Insurance | null> {
    return this.insuranceModel
      .findByIdAndUpdate(id, insurancesData, { new: true })
      .exec();
  }

  async findBy(filter: any, error: boolean = true): Promise<any[]> {
    const insurance = await this.insuranceModel
      .find({ ...filter })
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .exec();

    if (!insurance && insurance.length === 0 && error) {
      throw new NotFoundException(
        `Budge with ${JSON.stringify(filter)} not found `,
      );
    }

    return insurance;
  }

  async report(initDate: Date, endDate: Date): Promise<any> {
    const result = await this.insuranceModel
      .aggregate([
        {
          $lookup: {
            from: 'repairOrders',
            localField: '_id',
            foreignField: 'budgetData.insuranceCompany',
            as: 'orders',
          },
        },
        {
          $unwind: '$orders',
        },
        {
          $match: {
            'orders.budgetData.statusChange': {
              $elemMatch: {
                status: 'Esperando aprobación',
                initDate: { $gte: initDate },
                endDate: { $lte: endDate, $ne: null }, // Orden aprobada
              },
            },
          },
        },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' }, // Ajusta según tus campos
            totalOrdenesAprobadas: { $sum: 1 },
          },
        },
      ])
      .exec();
    return result;
  }
}
