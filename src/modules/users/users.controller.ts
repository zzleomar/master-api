import {
  Controller,
  Get,
  Post,
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
import { Master, SuperAdmin } from '../auth/utils/decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Master()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
    return this.usersService.findAll();
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

  @Master()
  @SuperAdmin()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
