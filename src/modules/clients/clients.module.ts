import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsSchema } from './entities/client.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Client', schema: ClientsSchema }]),
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
  ],
  providers: [ClientsService, WorkshopsService],
})
export class ClientsModule {}
