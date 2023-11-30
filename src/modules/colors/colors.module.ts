import { Module } from '@nestjs/common';
import { ColorsService } from './colors.service';
import { ColorsController } from './colors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ColorsSchema } from './entities/color.entity';
import { AuthGuard } from '../auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Color', schema: ColorsSchema }]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ColorsController],
  providers: [ColorsService, AuthGuard],
})
export class ColorsModule {}
