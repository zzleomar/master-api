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

  async findAll(): Promise<Insurance[]> {
    return this.insuranceModel.find().exec();
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
    const insurance = await this.insuranceModel.find({ ...filter }).exec();

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
