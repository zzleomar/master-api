import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel('Vehicle') private readonly vehicleModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
    private readonly clientsService: ClientsService,
  ) {}

  async create(body: CreateVehicleDto): Promise<any> {
    if (body.workshop && body.owner) {
      await this.workshopsService.findOne(body.workshop);
      await this.clientsService.findOne(body.owner);
      const createdVehicle = new this.vehicleModel(body);
      const vehicle = await createdVehicle.save();
      return vehicle;
    } else {
      throw new BadRequestException('workshop y owner is requerid');
    }
  }

  async findOne(id: string, error: boolean = true): Promise<any> {
    const vehicle = await this.vehicleModel.findOne({ _id: id }).exec();

    if (!vehicle && error) {
      throw new NotFoundException(`vehicle with id:${id} not found `);
    }
    return vehicle;
  }
}
