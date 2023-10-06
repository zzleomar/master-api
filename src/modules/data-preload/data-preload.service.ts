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
      const admin: CreateUserDto = {
        firstName: 'José',
        lastName: 'Perez',
        email: 'cmoreno@megashopty.com',
        cell: '8339911',
        role: 'Admin',
        password: await this.authService.hashPassword('master123'),
        workshop: workshops[0].id,
      };
      await this.userService.create(admin);
      const cotizador: CreateUserDto = {
        firstName: 'Eli',
        lastName: 'Acme',
        email: 'cotizador@prueba.com',
        cell: '8338226',
        role: 'Cotizador',
        password: await this.authService.hashPassword('cotizador123'),
        workshop: workshops[0].id,
      };
      await this.userService.create(cotizador);
      const recepcion: CreateUserDto = {
        firstName: 'Luisa',
        lastName: 'Gomez',
        email: 'recepcion@prueba.com',
        cell: '8338848',
        role: 'Recepcion',
        password: await this.authService.hashPassword('recepcion123'),
        workshop: workshops[0].id,
      };
      await this.userService.create(recepcion);
      const repuesto: CreateUserDto = {
        firstName: 'Leo',
        lastName: 'Susu',
        email: 'repuestos@prueba.com',
        cell: '8337340',
        role: 'Repuesto',
        password: await this.authService.hashPassword('repuestos123'),
        workshop: workshops[0].id,
      };
      await this.userService.create(repuesto);
      return { admin, cotizador, recepcion, repuesto };
    }
    return 'datos ya cargados';
  }
}
