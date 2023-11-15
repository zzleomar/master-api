import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoriesSchema } from '../histories/entities/history.entity';
import { ClientsSchema } from '../clients/entities/client.entity';
import { BudgetSchema } from './entities/budget.entity';
import { VehicleSchema } from '../vehicles/entities/vehicle.entity';
import { HistoriesService } from '../histories/histories.service';
import { ClientsService } from '../clients/clients.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { jwtConstants } from '../auth/utils/constants';
import { JwtModule } from '@nestjs/jwt';
import { UsersSchema } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '../auth/auth.guard';
import { InsurancesSchema } from '../insurances/entities/insurance.entity';
import { InsurancesService } from '../insurances/insurances.service';
import { RepairOrderSchema } from '../repair-orders/entities/repair-order.entity';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';

@Module({
  imports: [
    JwtModule.register({
      // Configura JwtModule aquí
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
  controllers: [BudgetsController],
  providers: [
    InsurancesService,
    BudgetsService,
    HistoriesService,
    ClientsService,
    VehiclesService,
    WorkshopsService,
    AuthGuard,
    UsersService,
    RepairOrdersService,
  ],
})
export class BudgetsModule {}
