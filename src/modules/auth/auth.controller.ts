import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    try {
      return this.authService.signIn(signInDto.email, signInDto.password);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(AuthGuard)
  @Get()
  loadData(@Request() request) {
    try {
      return request['user'];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
