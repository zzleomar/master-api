import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsSchema } from './entities/client.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { ClientsController } from './client.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Client', schema: ClientsSchema }]),
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ClientsController],
  providers: [ClientsService, WorkshopsService, AuthGuard],
})
export class ClientsModule {}
