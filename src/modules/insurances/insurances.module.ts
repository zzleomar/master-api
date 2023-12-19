import { Module } from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { InsurancesController } from './insurances.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { InsurancesSchema } from './entities/insurance.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: 'Insurance', schema: InsurancesSchema },
    ]),
  ],
  controllers: [InsurancesController],
  providers: [InsurancesService, AuthGuard],
})
export class InsurancesModule {}
