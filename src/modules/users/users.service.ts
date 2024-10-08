import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPayload } from './entities/user.payload';
import { CreateWorkshopDto } from '../workshops/dto/create-workshop.dto';
import { WorkshopsService } from '../workshops/workshops.service';
import { User } from './entities/user.entity';
import { map, omit } from 'lodash';
import { faker } from '@faker-js/faker';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async createMasterAndWorkshop(
    createUserDto: CreateUserDto,
    createWorkshopDto: CreateWorkshopDto,
  ) {
    const session = await this.userModel.startSession();
    session.startTransaction();

    try {
      const master = new this.userModel(createUserDto);
      await master.save();

      const workshop = await this.workshopsService.create({
        ...createWorkshopDto,
        owner: master._id,
      });

      master.workshop = workshop._id;
      await master.save();

      await session.commitTransaction();
      session.endSession();

      return { master, workshop };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestException(error.message);
    }
  }

  async create(body: CreateUserDto): Promise<User> {
    if (body.workshop) {
      await this.workshopsService.findOne(body.workshop);
    }
    const createdUser = new this.userModel(body);
    const user = await createdUser.save();
    return user;
  }

  async findOne(id: string): Promise<UserPayload> {
    const user = await this.userModel
      .findOne({ _id: id })
      .populate(['workshop'])
      .exec();
    if (!user) {
      throw new NotFoundException(`User with id:${id} not found `);
    }
    return user;
  }

  async findOneByEmail(
    email: string,
    error: boolean = true,
  ): Promise<UserPayload> {
    const user = await this.userModel
      .findOne({ email: email })
      .populate(['workshop'])
      .exec();
    if (!user && error) {
      throw new NotFoundException(`User with email:${email} not found `);
    }
    return user;
  }

  async findAll(filter: any): Promise<UserPayload[]> {
    const users = await this.userModel.find(filter);
    return map(users, (obj) => omit(obj, 'password'));
  }

  async update(id: string, body: UpdateUserDto): Promise<UserPayload> {
    if (body.workshop) {
      await this.workshopsService.findOne(body.workshop);
    }
    await this.userModel.updateOne({ _id: id }, body);
    const updatedUser = this.userModel.findById(id);
    return updatedUser;
  }

  async updateProfile(id: string, body: UpdateUserDto): Promise<UserPayload> {
    if (body.workshop) {
      await this.workshopsService.findOne(body.workshop);
    }
    await this.userModel.updateOne({ _id: new Types.ObjectId(id) }, body);
    const updatedUser = await this.userModel
      .findOne({ _id: new Types.ObjectId(id) })
      .exec();
    return updatedUser;
  }

  async changeStatusUser(body: any): Promise<UserPayload> {
    if (body.workshop) {
      await this.workshopsService.findOne(body.workshop);
    }
    await this.userModel.updateOne({ _id: body.id }, body);
    const updatedUser = this.userModel.findById(body.id);
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    let workshop = null;
    const user = await this.userModel.findOne({ _id: id }).exec();
    if (!user) {
      throw new NotFoundException(`User with email id:${id} not found `);
    }
    if (user.role === 'Admin') {
      workshop = await this.workshopsService.findOne(user.workshop, false);
    }
    if (workshop === null) {
      await this.userModel.deleteOne({ _id: id });
    } else {
      throw new BadRequestException(`Action invalid`);
    }
  }

  async findUserByFilter(filter: any): Promise<any[]> {
    return this.userModel
      .aggregate([
        {
          $match: {
            ...filter,
          },
        },
        {
          $sort: {
            createdAt: -1, // Ordena por la placa del vehículo en orden descendente
          },
        },
      ])
      .exec();
  }

  async sendResetPassword(user: UserPayload) {
    const hashReset = await faker.string.alphanumeric(6).toUpperCase();

    const result = await this.userModel.findOneAndUpdate(
      { _id: user._id },
      { hashReset },
    );

    return { hashReset, result };
  }

  async resetPassword(user: UserPayload, newPassword: Promise<string>) {
    const password = await newPassword;
    const result = this.userModel.updateOne(
      { _id: user._id },
      { hashReset: '', password },
    );
    return result;
  }
}
