import {
  BadRequestException,
  Controller,
  Post,
  // UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { DataPreloadService } from './data-preload.service';
// import { SuperAdmin } from '../auth/utils/decorator';
// import { AuthGuard } from '../auth/auth.guard';

@Controller('preload')
export class DataPreloadController {
  constructor(private dataPreload: DataPreloadService) {}

  @Post('/super')
  preload() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.dataPreload.loadSuper();
      }
      throw new NotFoundException();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @UseGuards(AuthGuard)
  // @SuperAdmin()
  @Post('/workshop')
  preloadData() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.dataPreload.preloadData();
      }
      throw new NotFoundException();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // @UseGuards(AuthGuard)
  // @SuperAdmin()
  @Post('/dataTest')
  dataTest() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.dataPreload.loadDataTest();
      }
      throw new NotFoundException();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
