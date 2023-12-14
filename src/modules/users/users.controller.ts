/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Request,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateWorkshopDto } from 'src/modules/workshops/dto/create-workshop.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  Master,
  SuperAdmin,
  Admin,
  Cotizador,
  Recepcion,
  Repuesto,
} from '../auth/utils/decorator';
import { Types } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @UseGuards(AuthGuard)
  @Master()
  @Post()
  async create(@Request() request, @Body() createUserDto: any) {
    const user = request['user'];
    let sendedEmail: any = null;

    const generatePass = () => {
      let stringAleatorio = '';
      for (let i = 0; i < 8; i++) {
        stringAleatorio += String.fromCharCode(
          Math.floor(Math.random() * 26) + 97,
        );
      }
      return stringAleatorio;
    };

    const newPassword = generatePass();
    const data = {
      ...createUserDto,
      password: await this.authService.hashPassword(newPassword),
      workshop: new Types.ObjectId(user.workshop),
    };
    const newUser: any = await this.usersService.create(data);

    try {
      await this.emailService.findAndSend('newUser', {
        email: newUser.email,
        user: newUser.email,
        webUrl: process.env.WEBURL,
        fullname: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role,
        password: newPassword,
      });

      sendedEmail = {
        success: true,
      };
    } catch (error) {
      sendedEmail = {
        success: false,
        error: error,
      };
    }

    return {
      ...newUser,
      sendedEmail: sendedEmail,
    };
  }

  @UseGuards(AuthGuard)
  @Master()
  @Post('/list')
  async getall(@Request() request, @Body() filters: any) {
    // const user = request['user'];
    const filtro: any = filters;

    const search = filtro.value.split(' ');

    return this.usersService.findUserByFilter({
      // workshop: new Types.ObjectId(user.workshop),
      role: {
        $nin: ['SuperAdmin', 'Master'],
      },
      $or: [
        {
          firstName: {
            $regex: search.length === 1 ? filtro.value : search[0],
            $options: 'i',
          },
        },
        {
          lastName: {
            $regex: search.length === 1 ? filtro.value : search[1],
            $options: 'i',
          },
        },
      ],
    });
  }

  @UseGuards(AuthGuard)
  @Master()
  @Post('/status')
  async changeStatusUser(@Request() request, @Body() data: any) {
    // const user = request['user'];

    return this.usersService.changeStatusUser({
      ...data,
      // workshop: new Types.ObjectId(user.workshop),
    });
  }

  @SuperAdmin()
  @UseGuards(AuthGuard)
  @Post('/master')
  async createMasterAndWorkshop(
    @Body() createUserDto: CreateUserDto,
    @Body() createWorkshopDto: CreateWorkshopDto,
  ) {
    try {
      const { master, workshop } =
        await this.usersService.createMasterAndWorkshop(
          createUserDto,
          createWorkshopDto,
        );

      return { master, workshop };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @Master()
  @UseGuards(AuthGuard)
  findAll() {
    return this.usersService.findAll(null);
  }

  @Get('/quoter')
  @UseGuards(AuthGuard)
  findQuoter(@Request() request) {
    const user = request['user'];
    return this.usersService.findAll({
      workshop: user.workshop,
      role: 'Cotizador',
    });
  }

  @UseGuards(AuthGuard)
  @Master()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Master()
  @SuperAdmin()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Post('/profile')
  updateProfile(@Request() request, @Body() updateUserDto: UpdateUserDto) {
    const user = request['user'];
    return this.usersService.updateProfile(user._id, updateUserDto);
  }

  @Master()
  @SuperAdmin()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
