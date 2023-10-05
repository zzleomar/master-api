import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPayload } from './entities/user.payload';
import { CreateWorkshopDto } from 'src/modules/workshops/dto/create-workshop.dto';
import { WorkshopsService } from 'src/modules/workshops/workshops.service';

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

  async create(body: CreateUserDto): Promise<UserPayload> {
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
      throw new NotFoundException(`User with email id:${id} not found `);
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

  async findAll(): Promise<UserPayload[]> {
    const users = await this.userModel.find();
    return users;
  }

  async update(id: string, body: UpdateUserDto): Promise<UserPayload> {
    if (body.workshop) {
      await this.workshopsService.findOne(body.workshop);
    }
    await this.userModel.updateOne({ _id: id }, body);
    const updatedUser = this.userModel.findById(id);
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
}
