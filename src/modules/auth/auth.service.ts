/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email, false);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, workshop, ...payload } = user.toObject();
    payload.workshop = workshop?._id;
    return {
      token: await this.jwtService.signAsync(payload),
    };
  }
}
