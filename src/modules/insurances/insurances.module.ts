import { Module } from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { InsurancesController } from './insurances.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { InsurancesSchema } from './entities/insurance.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Insurance', schema: InsurancesSchema },
    ]),
  ],
  controllers: [InsurancesController],
  providers: [InsurancesService],
})
export class InsurancesModule {}
