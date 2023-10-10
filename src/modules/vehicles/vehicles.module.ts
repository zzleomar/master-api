import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleSchema } from './entities/vehicle.entity';
import { ClientsService } from '../clients/clients.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { ClientsSchema } from '../clients/entities/client.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Vehicle', schema: VehicleSchema }]),
    MongooseModule.forFeature([{ name: 'Client', schema: ClientsSchema }]),
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
  ],
  providers: [VehiclesService, ClientsService, WorkshopsService],
})
export class VehiclesModule {}
