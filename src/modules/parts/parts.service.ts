import { Injectable } from '@nestjs/common';
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

  async findAll(): Promise<Part[]> {
    return this.partModel.find().exec();
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
    return this.partModel.findByIdAndRemove(id, (err, doc) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Deleted document: ${doc}`);
      }
    });
  }
}
