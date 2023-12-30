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

  async findAll(all: boolean = true): Promise<MakesModels[]> {
    if (all) {
      return this.makeModelModel
        .find()
        .collation({ locale: 'en', strength: 2 })
        .sort({ make: 1 })
        .exec();
    } else {
      return this.makeModelModel
        .aggregate([
          {
            $match: {
              status: true,
              'models.status': true,
            },
          },
          {
            $project: {
              make: 1,
              models: {
                $filter: {
                  input: '$models',
                  as: 'model',
                  cond: { $eq: ['$$model.status', true] }, // Solo modelos con status en verdadero
                },
              },
            },
          },
          /* {
            $collation: { locale: 'en', strength: 2 },
          }, */
          {
            $sort: { make: 1 },
          },
        ])
        .exec();
    }
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

  async searchModels(
    filter: any = {},
    page: number = 0,
    pageSize: number = 30,
  ): Promise<any> {
    const query: any = this.makeModelModel.aggregate([
      {
        $match: {
          ...filter,
        },
      },
      {
        $unwind: '$models',
      },
      {
        $match: {
          ...filter,
        },
      },
      {
        $group: {
          _id: {
            _id: '$_id',
            make: '$make',
            status: '$status',
          },
          models: { $push: '$models' },
        },
      },
      {
        $unwind: '$models',
      },
      {
        $project: {
          make: '$_id',
          _id: '$models._id',
          status: '$models.status',
          model: '$models.model',
          year: '$models.year',
          paint: '$models.paint',
        },
      },
    ]);

    const total = await query.exec();
    // const total = await this.makeModelModel.countDocuments(filter).exec();

    const results: any[] = await query
      .sort({ 'make.make': 1, model: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return { results, total: total.length };
  }

  async findOne(id: string): Promise<MakesModels | null> {
    return this.makeModelModel.findById(id).exec();
  }

  async find(name: string, makemode: string): Promise<any> {
    return (
      this.makeModelModel
        // .find({ [makemode]: { $regex: name, $options: 'i' } })
        // .find({ [makemode]: { $regex: new RegExp(name, 'i') } })
        .find({ [makemode]: { $regex: new RegExp(`^${name}$`, 'i') } })
        .exec()
    );
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
