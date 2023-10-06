import { Module } from '@nestjs/common';
import { WorkshopSchema } from './entities/workshop.entity';
import { WorkshopsService } from './workshops.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [WorkshopsService],
})
export class WorkshopsModule {}
