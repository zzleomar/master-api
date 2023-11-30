import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ClientsService } from '../clients/clients.service';
import { VehiclePayload } from './entities/vehicle.payload';

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

  async update(id: string, body: UpdateVehicleDto): Promise<any> {
    if (body.workshop) {
      const workshop = await this.workshopsService.findOne(body.workshop);
      if (!workshop) {
        throw new BadRequestException('workshop not found');
      }
    }
    if (body.owner) {
      const owner = await this.clientsService.findOne(body.owner);
      if (!owner) {
        throw new BadRequestException('owner not found');
      }
    }
    await this.vehicleModel.updateOne({ _id: id }, body);
    const updatedClient = this.vehicleModel.findById(id);
    return updatedClient;
  }

  async findOne(id: string, error: boolean = true): Promise<any> {
    const vehicle = await this.vehicleModel.findOne({ _id: id }).exec();
    if (!vehicle && error) {
      throw new NotFoundException(`vehicle with id:${id} not found `);
    }
    return vehicle;
  }

  async findAll(search: null | string = null): Promise<VehiclePayload[]> {
    let vehicles: any = [];
    if (search && search !== '') {
      vehicles = await this.vehicleModel.find({
        plate: {
          $regex: `.*${search}.*`,
          // $eq: search,
        },
      });
    } else {
      vehicles = await this.vehicleModel.find();
    }
    return vehicles;
  }

  async remove(id: string): Promise<void> {
    let workshop = null;
    const vehicle = await this.vehicleModel.findOne({ plate: id }).exec();
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with plate:${id} not found `);
    }
    if (vehicle.role === 'Admin') {
      workshop = await this.workshopsService.findOne(vehicle.workshop, false);
    }
    if (workshop === null) {
      await this.vehicleModel.deleteOne({ _plate: id });
    } else {
      throw new BadRequestException(`Action invalid`);
    }
  }
}
