import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersSchema } from './entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';
import { AuthGuard } from '../auth/auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UsersSchema }]), // Registra el modelo User
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, WorkshopsService, AuthGuard],
})
export class UsersModule {}
