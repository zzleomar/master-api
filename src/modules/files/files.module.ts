import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { AuthGuard } from '../auth/auth.guard';
import { jwtConstants } from '../auth/utils/constants';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      // Configura JwtModule aquí
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, AuthGuard],
})
export class FilesModule {}
