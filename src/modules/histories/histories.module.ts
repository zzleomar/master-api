import { Module } from '@nestjs/common';
import { HistoriesService } from './histories.service';
import { HistoriesController } from './histories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoriesSchema } from './entities/history.entity';

import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { RepairOrderSchema } from '../repair-orders/entities/repair-order.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { BudgetSchema } from '../budgets/entities/budget.entity';
import { BudgetsService } from '../budgets/budgets.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { ClientsSchema } from '../clients/entities/client.entity';
import { UsersSchema } from '../users/entities/user.entity';
import { VehicleSchema } from '../vehicles/entities/vehicle.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ClientsService } from '../clients/clients.service';
import { InsurancesService } from '../insurances/insurances.service';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { InsurancesSchema } from '../insurances/entities/insurance.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'History', schema: HistoriesSchema }]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([{ name: 'Vehicle', schema: VehicleSchema }]),
    MongooseModule.forFeature([{ name: 'Client', schema: ClientsSchema }]),
    MongooseModule.forFeature([{ name: 'Budget', schema: BudgetSchema }]),
    MongooseModule.forFeature([
      { name: 'Insurance', schema: InsurancesSchema },
    ]),
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: 'RepairOrder', schema: RepairOrderSchema },
    ]),
  ],
  controllers: [HistoriesController],
  providers: [
    HistoriesService,
    RepairOrdersService,
    BudgetsService,
    InsurancesService,
    ClientsService,
    VehiclesService,
    WorkshopsService,
    AuthGuard,
    UsersService,
  ],
})
export class HistoriesModule {}
