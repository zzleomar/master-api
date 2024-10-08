import { BadRequestException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Color } from './entities/color.entity';

@Injectable()
export class ColorsService {
  constructor(@InjectModel('Color') private readonly colorModel: Model<any>) {}

  async create(colorsData: any): Promise<Color> {
    const createdMakesModels = new this.colorModel(colorsData);
    return createdMakesModels.save();
  }

  async createMany(data: any[]): Promise<Color[]> {
    const createdMakesModels = await this.colorModel.create(data);
    return createdMakesModels;
  }

  async findAll(): Promise<Color[]> {
    return this.colorModel.find().sort({ color: 1 }).exec();
  }

  async findOne(id: string): Promise<Color | null> {
    return this.colorModel.findById(id).exec();
  }

  async update(id: string, colorsData: any): Promise<Color | null> {
    return this.colorModel
      .findByIdAndUpdate(id, colorsData, { new: true })
      .exec();
  }
  async remove(id: string): Promise<any> {
    try {
      const doc = await this.colorModel.findByIdAndDelete(id).exec();
      return doc;
    } catch (err) {
      throw new BadRequestException(`Error inesperado`);
    }
  }
}
