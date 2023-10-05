import { Module } from '@nestjs/common';
import { WorkshopSchema } from './entities/workshop.entity';
import { WorkshopsService } from './workshops.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
  ],
  providers: [WorkshopsService],
})
export class WorkshopsModule {}
