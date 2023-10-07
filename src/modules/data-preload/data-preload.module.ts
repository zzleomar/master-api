import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DataPreloadController } from './data-preload.controller';
import { DataPreloadService } from './data-preload.service';

import { AuthService } from '../auth/auth.service';

import { UsersService } from '../users/users.service';
import { UsersSchema } from '../users/entities/user.entity';

import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { WorkshopsService } from '../workshops/workshops.service';

import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';

import { MakesModelsService } from '../makes-models/makes-models.service';
import { MakesModelsSchema } from '../makes-models/entities/makesModels.entity';

import { ColorsService } from '../colors/colors.service';
import { ColorsSchema } from '../colors/entities/color.entity';

import { InsurancesService } from '../insurances/insurances.service';
import { InsurancesSchema } from '../insurances/entities/insurance.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UsersSchema }]), // Registra el modelo User
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    MongooseModule.forFeature([{ name: 'Color', schema: ColorsSchema }]),
    MongooseModule.forFeature([
      { name: 'Insurance', schema: InsurancesSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'MakeModel', schema: MakesModelsSchema },
    ]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [DataPreloadController],
  providers: [
    DataPreloadService,
    UsersService,
    AuthService,
    WorkshopsService,
    MakesModelsService,
    ColorsService,
    InsurancesService,
  ],
})
export class DataPreloadModule {}
