import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateWorkshopDto } from '../workshops/dto/create-workshop.dto';

@Injectable()
export class DataPreloadService {
  constructor(
    private readonly userService: UsersService,
    private readonly workshopService: WorkshopsService,
    private readonly authService: AuthService,
  ) {}

  async loadSuper() {
    const superUser = await this.userService.findOneByEmail(
      process.env.EMAILSUPER,
      false,
    );
    if (!superUser) {
      const password = await this.authService.hashPassword(
        process.env.PASSWORDSUPER,
      );
      const superAdmin: CreateUserDto = {
        firstName: process.env.FIRSTNAMESUPER,
        lastName: process.env.LASTNAMESUPER,
        email: process.env.EMAILSUPER,
        cell: process.env.CELLSUPER,
        role: 'SuperAdmin',
        password,
      };
      await this.userService.create(superAdmin);
    }
    return 'super usuario ya registrado';
  }

  async preloadData() {
    const workshop = await this.workshopService.findAll();
    if (workshop.length === 0) {
      const createUserDto: CreateUserDto = {
        firstName: process.env.FIRSTNAMESUPER,
        lastName: process.env.LASTNAMESUPER,
        email: process.env.EMAILMASTER,
        cell: process.env.CELLSUPER,
        role: 'Master',
        password: await this.authService.hashPassword(
          process.env.PASSWORDSUPER,
        ),
      };

      const createWorkshopDto: CreateWorkshopDto = {
        name: 'MegaShop',
        url: 'logo',
      };
      const data = await this.userService.createMasterAndWorkshop(
        createUserDto,
        createWorkshopDto,
      );
      return data;
    }
    return 'workshop ya registrado';
  }

  async loadDataTest() {
    const workshops = await this.workshopService.findAll();
    const users = await this.userService.findAll();
    if (workshops.length === 1 && users.length == 2) {
      const password = await this.authService.hashPassword(
        process.env.PASSWORDSUPER,
      );
      const admin: CreateUserDto = {
        firstName: 'Admin',
        lastName: 'Admin',
        email: 'admin@gmail.com',
        cell: process.env.CELLSUPER,
        role: 'Admin',
        password,
      };
      await this.userService.create(admin);
      const cotizador: CreateUserDto = {
        firstName: 'Cotizador',
        lastName: 'Cotizador',
        email: 'cotizador@gmail.com',
        cell: process.env.CELLSUPER,
        role: 'Cotizador',
        password,
      };
      await this.userService.create(cotizador);
      const recepcion: CreateUserDto = {
        firstName: 'Recepcion',
        lastName: 'Recepcion',
        email: 'recepcion@gmail.com',
        cell: process.env.CELLSUPER,
        role: 'Recepcion',
        password,
      };
      await this.userService.create(recepcion);
      const repuesto: CreateUserDto = {
        firstName: 'Repuesto',
        lastName: 'Repuesto',
        email: 'repuesto@gmail.com',
        cell: process.env.CELLSUPER,
        role: 'Repuesto',
        password,
      };
      await this.userService.create(repuesto);
      return { admin, cotizador, recepcion, repuesto };
    }
    return 'datos ya cargados';
  }
}
