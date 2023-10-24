import { Module } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PartsSchema } from './entities/part.entity';
import { AuthGuard } from '../auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Part', schema: PartsSchema }]),
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [PartsController],
  providers: [PartsService, AuthGuard],
})
export class PartsModule {}
