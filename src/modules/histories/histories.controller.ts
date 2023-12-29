/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FilterHistoryDto } from './dto/filter-history.dto';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { BudgetsService } from '../budgets/budgets.service';
import {
  Admin,
  Cotizador,
  Master,
  Recepcion,
  Repuesto,
} from '../auth/utils/decorator';
import { HistoriesService } from './histories.service';
import { AuthGuard } from '../auth/auth.guard';
import mongoose from 'mongoose';

@Controller('histories')
export class HistoriesController {
  constructor(
    private readonly historiesService: HistoriesService,
    // private readonly repairOrdersService: RepairOrdersService,
    // private readonly budgetsService: BudgetsService,
  ) {}

  @Master()
  @Cotizador()
  @Admin()
  @Recepcion()
  @Repuesto()
  @UseGuards(AuthGuard)
  @Post('/list')
  findAll(@Request() request, @Body() filters: FilterHistoryDto) {
    const filtro: any = filters;

    if (filtro.value) {
      let filterField = 'budget';

      switch (filtro.filter) {
        case 'orders':
          filterField = 'ro';
          break;
        case 'budgets':
          filterField = 'budget';
          break;
        default:
          filterField = 'budget';
          break;
      }

      return this.historiesService.findHistoryByFilter(
        {
          [filterField]: filtro.value,
        },
        filtro.page,
        filtro.pagesize,
      );
    } else {
      return new BadRequestException('value requerid');
    }
  }
}
