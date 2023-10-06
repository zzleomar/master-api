import { Module } from '@nestjs/common';
import { DataPreloadService } from './data-preload.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../users/entities/user.entity';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { DataPreloadController } from './data-preload.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]), // Registra el modelo User
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [DataPreloadController],
  providers: [DataPreloadService, UsersService, AuthService, WorkshopsService],
})
export class DataPreloadModule {}
