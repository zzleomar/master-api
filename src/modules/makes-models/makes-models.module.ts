import { Module } from '@nestjs/common';
import { MakesModelsService } from './makes-models.service';
import { MakesModelsSchema } from './entities/makesModels.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MakesModelsController } from './makes-models.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'MakeModel', schema: MakesModelsSchema },
    ]),
  ],
  controllers: [MakesModelsController],
  providers: [MakesModelsService],
})
export class MakesModelsModule {}
