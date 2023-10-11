import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateClientDto } from './dto/create-client.dto';

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
}
