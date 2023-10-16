/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email, false);
    const isAuthenticated = await this.comparePasswords(user?.password, pass);
    if (!isAuthenticated) {
      throw new UnauthorizedException();
    }
    const { password, workshop, ...payload } = user.toObject();
    payload.workshop = workshop?._id;
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });
    return {
      token,
      user,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.SALTROUNDS);
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(
    hashedPassword: string = '',
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
