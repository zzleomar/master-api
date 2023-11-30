import {
  BadRequestException,
  Controller,
  Post,
  // UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { DataPreloadService } from './data-preload.service';

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

  // @UseGuards(AuthGuard)
  // @SuperAdmin()
  @Post('/dataTestFull')
  loadDataTestFull() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.dataPreload.loadDataTestFull();
      }
      throw new NotFoundException();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/clients')
  preloadClient() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.dataPreload.loadClient();
      }
      throw new NotFoundException();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('/vehicles')
  preloadVehicle() {
    try {
      if (process.env.NODE_ENV === 'development') {
        return this.dataPreload.loadVehicle();
      }
      throw new NotFoundException();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
