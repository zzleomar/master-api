import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Request,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Master, SuperAdmin } from '../auth/utils/decorator';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import mongoose from 'mongoose';

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly repairOrdersService: RepairOrdersService,
  ) {}

  @UseGuards(AuthGuard)
  @Master()
  @Post()
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @Master()
  @UseGuards(AuthGuard)
  findAll(@Query('search') search: string | null) {
    return this.vehiclesService.findAll(search);
  }

  @UseGuards(AuthGuard)
  @Master()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Master()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Master()
  @SuperAdmin()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }

  @Master()
  @SuperAdmin()
  @UseGuards(AuthGuard)
  @Get('ot/:id')
  async getOtCount(@Request() request, @Param('id') id: string) {
    const user = request['user'];

    const budgets = await this.repairOrdersService.findOrderByFilter(
      {
        workshop: new mongoose.Types.ObjectId(user.workshop),
        initOT: { $ne: null },
      },
      {
        value: new mongoose.Types.ObjectId(id),
        label: 'budgetData.vehicleData._id',
      },
    );

    return (budgets && budgets.length) || 0;
  }
}
