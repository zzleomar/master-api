import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';
import { Role } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  cell: string;

  @IsString()
  prefix: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsString()
  password: string;

  @IsOptional() // El workshop es opcional para los SuperAdmin
  @IsMongoId() // Debe ser un ID válido de MongoDB
  workshop?: string;
}
