import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersSchema } from '../users/entities/user.entity';
import { WorkshopsService } from '../workshops/workshops.service';
import { WorkshopSchema } from '../workshops/entities/workshop.entity';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from './utils/constants';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UsersSchema }]), // Registra el modelo User
    MongooseModule.forFeature([{ name: 'Workshop', schema: WorkshopSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, UsersService, WorkshopsService],
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
