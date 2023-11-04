import { Module } from '@nestjs/common';
import { RepairOrdersService } from './repair-orders.service';
import { RepairOrdersController } from './repair-orders.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetSchema } from '../budgets/entities/budget.entity';
import { RepairOrderSchema } from './entities/repair-order.entity';
import { BudgetsService } from '../budgets/budgets.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { HistoriesSchema } from '../histories/entities/history.entity';
import { ClientsSchema } from '../clients/entities/client.entity';
import { UsersSchema } from '../users/entities/user.entity';
import { VehicleSchema } from '../vehicles/entities/vehicle.entity';
import { AuthGuard } from '../auth/auth.guard';
import { ClientsService } from '../clients/clients.service';
import { HistoriesService } from '../histories/histories.service';
import { InsurancesService } from '../insurances/insurances.service';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { InsurancesSchema } from '../insurances/entities/insurance.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([{ name: 'History', schema: HistoriesSchema }]),
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
  controllers: [RepairOrdersController],
  providers: [
    RepairOrdersService,
    BudgetsService,
    InsurancesService,
    BudgetsService,
    HistoriesService,
    ClientsService,
    VehiclesService,
    WorkshopsService,
    AuthGuard,
    UsersService,
  ],
})
export class RepairOrdersModule {}
