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
import { BudgetsService } from '../budgets/budgets.service';
import { HistoriesService } from '../histories/histories.service';
import { ClientsService } from '../clients/clients.service';
import { BudgetSchema } from '../budgets/entities/budget.entity';
import { ClientsSchema } from '../clients/entities/client.entity';
import { HistoriesSchema } from '../histories/entities/history.entity';
import { VehicleSchema } from '../vehicles/entities/vehicle.entity';
import { VehiclesService } from '../vehicles/vehicles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UsersSchema }]), // Registra el modelo User
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    MongooseModule.forFeature([{ name: 'Color', schema: ColorsSchema }]),
    MongooseModule.forFeature([{ name: 'History', schema: HistoriesSchema }]),
    MongooseModule.forFeature([{ name: 'Vehicle', schema: VehicleSchema }]),
    MongooseModule.forFeature([{ name: 'Client', schema: ClientsSchema }]),
    MongooseModule.forFeature([{ name: 'Budget', schema: BudgetSchema }]),
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
    BudgetsService,
    HistoriesService,
    ClientsService,
    VehiclesService,
  ],
})
export class DataPreloadModule {}
