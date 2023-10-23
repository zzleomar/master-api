import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientPayload } from './entities/client.payload';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel('Client') private readonly clientModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(body: CreateClientDto): Promise<any> {
    if (body.workshop) {
      await this.workshopsService.findOne(body.workshop);
      const createdClient = new this.clientModel(body);
      const client = await createdClient.save();
      return client;
    } else {
      throw new BadRequestException('workshop is requerid');
    }
  }

  async findOne(id: string, error: boolean = true): Promise<any> {
    const client = await this.clientModel.findOne({ _id: id }).exec();

    if (!client && error) {
      throw new NotFoundException(`Client with id:${id} not found `);
    }
    return client;
  }

  async findAll(search: null | string = null): Promise<ClientPayload[]> {
    let clients: any = [];
    if (search && search !== '') {
      clients = await this.clientModel.find({
        where: {
          plate: {
            like: `%${search}%`,
          },
        },
      });
    } else {
      clients = await this.clientModel.find();
    }
    return clients;
  }

  async update(id: string, body: UpdateClientDto): Promise<ClientPayload> {
    await this.clientModel.updateOne({ _id: id }, body);
    const updatedClient = this.clientModel.findById(id);
    return updatedClient;
  }

  async remove(id: string): Promise<void> {
    let workshop = null;
    const client = await this.clientModel.findOne({ id: id }).exec();
    if (!client) {
      throw new NotFoundException(`Client with plate:${id} not found `);
    }
    if (client.role === 'Admin') {
      workshop = await this.workshopsService.findOne(client.workshop, false);
    }
    if (workshop === null) {
      await this.clientModel.deleteOne({ _plate: id });
    } else {
      throw new BadRequestException(`Action invalid`);
    }
  }
}
