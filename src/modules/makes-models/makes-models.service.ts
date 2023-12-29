import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MakesModels } from './entities/makesModels.entity';

@Injectable()
export class MakesModelsService {
  constructor(
    @InjectModel('MakeModel') private readonly makeModelModel: Model<any>,
  ) {}

  async create(makesModelsData: any): Promise<MakesModels> {
    const createdMakesModels = new this.makeModelModel(makesModelsData);
    return createdMakesModels.save();
  }

  async createMany(data: any[]): Promise<MakesModels[]> {
    const createdMakesModels = await this.makeModelModel.create(data);
    return createdMakesModels;
  }

  async findAll(): Promise<MakesModels[]> {
    return this.makeModelModel
      .find()
      .collation({ locale: 'en', strength: 2 })
      .sort({ make: 1 })
      .exec();
  }

  async search(
    filter: any = {},
    page: number = 0,
    pageSize: number = 30,
  ): Promise<any> {
    if (page === 0) {
      return this.makeModelModel
        .find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ make: 1 })
        .exec();
    } else {
      const countQuery = this.makeModelModel.countDocuments(filter);
      const results = await this.makeModelModel
        .find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ make: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec();
      const total = await countQuery.exec();
      return { results, total };
    }
  }

  async findOne(id: string): Promise<MakesModels | null> {
    return this.makeModelModel.findById(id).exec();
  }

  async update(id: string, makesModelsData: any): Promise<MakesModels | null> {
    return this.makeModelModel
      .findByIdAndUpdate(id, makesModelsData, { new: true })
      .exec();
  }
  async remove(id: string): Promise<any> {
    try {
      const doc = await this.makeModelModel.findByIdAndDelete(id).exec();
      return doc;
    } catch (err) {
      throw new BadRequestException(`Error inesperado`);
    }
  }
}
