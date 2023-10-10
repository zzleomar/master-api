import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { AuthModule } from './modules/auth/auth.module';
import * as dotenv from 'dotenv';
import { AuthGuard } from './modules/auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './modules/auth/utils/constants';
import { DataPreloadModule } from './modules/data-preload/data-preload.module';
import { MakesModelsModule } from './modules/makes-models/makes-models.module';
import { ColorsModule } from './modules/colors/colors.module';
import { InsurancesModule } from './modules/insurances/insurances.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { HistoriesModule } from './modules/histories/histories.module';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URI),
    AuthModule,
    UsersModule,
    WorkshopsModule,
    DataPreloadModule,
    MakesModelsModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' }, // Opciones de firma
    }),
    ColorsModule,
    InsurancesModule,
    BudgetsModule,
    ClientsModule,
    VehiclesModule,
    HistoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthGuard],
})
export class AppModule {}
