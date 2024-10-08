/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { BudgetsService } from '../budgets/budgets.service';
import { History } from './entities/history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UsersService } from '../users/users.service';
@Injectable()
export class HistoriesService {
  constructor(
    @InjectModel(History.name) private readonly historyModel: Model<History>,
    private readonly usersService: UsersService,
    // private readonly workshopsService: WorkshopsService,
    // private readonly budgetsSevice: BudgetsService,
  ) {}

  async createHistory(createHistoryDto: CreateHistoryDto): Promise<History> {
    const createdHistory = new this.historyModel(createHistoryDto);
    return createdHistory.save();
  }

  async findAll(): Promise<History[]> {
    return this.historyModel.find().exec();
  }

  async findHistoryByFilter(
    filter: any,
    page: number = 1,
    pageSize: number = 6,
  ): Promise<any> {
    const data: any[] = [];

    const total = await this.historyModel.countDocuments(filter).exec();

    const query: any = this.historyModel.aggregate([
      {
        $match: {
          ...filter,
        },
      },
    ]);

    const results: any[] = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    for await (const iterator of results) {
      const userId = iterator.user ?? '';

      const user = await this.usersService.findOne(userId);

      data.push({
        ...iterator,
        user,
      });
    }

    return { data, total };
  }
}
