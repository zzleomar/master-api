import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workshop } from './entities/workshop.entity';
import { Model } from 'mongoose';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { WorkshopPayload } from './entities/workshop.payload';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectModel(Workshop.name) private workshopModel: Model<Workshop>,
  ) {}

  async create(body: CreateWorkshopDto): Promise<WorkshopPayload> {
    const createdUser = new this.workshopModel(body);
    const workshop = await createdUser.save();
    return workshop;
  }

  async findOne(id: string, error: boolean = true): Promise<WorkshopPayload> {
    const workshop = await this.workshopModel.findOne({ _id: id }).exec();

    if (!workshop && error) {
      throw new NotFoundException(`Workshop with id:${id} not found `);
    }
    return workshop;
  }

  async findAll(): Promise<WorkshopPayload[]> {
    const users = await this.workshopModel.find();
    return users;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.workshopModel.deleteOne({ _id: id });
  }
}
