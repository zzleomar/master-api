import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleSchema } from './entities/vehicle.entity';
import { ClientsService } from '../clients/clients.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { ClientsSchema } from '../clients/entities/client.entity';
import { VehiclesController } from './vehicles.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { AuthGuard } from '../auth/auth.guard';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { RepairOrderSchema } from '../repair-orders/entities/repair-order.entity';
import { RepairOrdersController } from '../repair-orders/repair-orders.controller';
import { HistoriesSchema } from '../histories/entities/history.entity';
import { HistoriesService } from '../histories/histories.service';
import { BudgetsService } from '../budgets/budgets.service';
import { BudgetSchema } from '../budgets/entities/budget.entity';
import { UsersSchema } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { InsurancesService } from '../insurances/insurances.service';
import { InsurancesSchema } from '../insurances/entities/insurance.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'History', schema: HistoriesSchema }]),
    MongooseModule.forFeature([{ name: 'Vehicle', schema: VehicleSchema }]),
    MongooseModule.forFeature([{ name: 'Client', schema: ClientsSchema }]),
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    MongooseModule.forFeature([{ name: 'Budget', schema: BudgetSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: 'Insurance', schema: InsurancesSchema },
    ]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: 'RepairOrder', schema: RepairOrderSchema },
    ]),
  ],
  controllers: [VehiclesController, RepairOrdersController],
  providers: [
    VehiclesService,
    ClientsService,
    BudgetsService,
    WorkshopsService,
    RepairOrdersService,
    HistoriesService,
    UsersService,
    InsurancesService,
    AuthGuard,
  ],
})
export class VehiclesModule {}
