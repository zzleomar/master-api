import { Module } from '@nestjs/common';
import { HistoriesService } from './histories.service';
import { HistoriesController } from './histories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoriesSchema } from './entities/history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'History', schema: HistoriesSchema }]),
  ],
  controllers: [HistoriesController],
  providers: [HistoriesService],
})
export class HistoriesModule {}
