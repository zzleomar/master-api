import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History } from './entities/history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable()
export class HistoriesService {
  constructor(
    @InjectModel(History.name) private readonly historyModel: Model<History>,
  ) {}

  async createHistory(createHistoryDto: CreateHistoryDto): Promise<History> {
    const createdHistory = new this.historyModel(createHistoryDto);
    return createdHistory.save();
  }

  async findAll(): Promise<History[]> {
    return this.historyModel.find().exec();
  }
}
