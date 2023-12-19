import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Part } from './entities/part.entity';

@Injectable()
export class PartsService {
  constructor(@InjectModel('Part') private readonly partModel: Model<any>) {}

  async create(partsData: any): Promise<Part> {
    const createdPart = new this.partModel(partsData);
    return createdPart.save();
  }

  async createMany(data: any[]): Promise<Part[]> {
    const createdPart = await this.partModel.create(data);
    return createdPart;
  }

  async findAll(
    filter: any = {},
    page: number = 0,
    pageSize: number = 30,
  ): Promise<any> {
    if (page === 0) {
      return this.partModel.find(filter).exec();
    } else {
      const countQuery = this.partModel.countDocuments(filter);
      const results = await this.partModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec();
      const total = await countQuery.exec();
      return { results, total };
    }
  }

  async findOne(filter: any): Promise<Part | null> {
    return this.partModel.findOne(filter).exec();
  }

  async update(id: string, partsData: any): Promise<Part | null> {
    return this.partModel
      .findByIdAndUpdate(id, partsData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    try {
      const doc = await this.partModel.findByIdAndDelete<Part>(id).exec();
      return doc;
    } catch (err) {
      throw new BadRequestException(`Error inesperado`);
    }
  }
}
