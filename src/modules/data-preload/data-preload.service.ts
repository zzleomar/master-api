import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateWorkshopDto } from '../workshops/dto/create-workshop.dto';
import * as fs from 'fs';
import * as path from 'path';
import { map, replace, filter, groupBy } from 'lodash';
import { MakesModelsService } from '../makes-models/makes-models.service';
import { ColorsService } from '../colors/colors.service';
import { InsurancesService } from '../insurances/insurances.service';

@Injectable()
export class DataPreloadService {
  constructor(
    private readonly userService: UsersService,
    private readonly workshopService: WorkshopsService,
    private readonly authService: AuthService,
    private readonly makesModelsService: MakesModelsService,
    private readonly colorsService: ColorsService,
    private readonly insurancesService: InsurancesService,
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
      const { master, workshop } =
        await this.userService.createMasterAndWorkshop(
          createUserDto,
          createWorkshopDto,
        );

      //carga de los modelos y marcas
      let relativePath = './utils/marcamodelos.json';
      let absolutePath = path.join(
        replace(__dirname, 'dist', 'src'),
        relativePath,
      );
      let rawData = fs.readFileSync(absolutePath, 'utf8');
      let jsonData = JSON.parse(rawData);
      const formattedData = map(
        groupBy(
          filter(
            jsonData,
            (item2) =>
              item2.Make !== null &&
              item2.Model !== null &&
              item2.Model !== 'Elije el Modelo',
          ),
          'Make',
        ),
        (models, make) => ({
          make,
          models: map(models, (item) => ({
            model: item.Model,
            year: item.Year,
            paint: item.Picture,
          })),
        }),
      );

      const createdMakesModels =
        await this.makesModelsService.createMany(formattedData);

      //carga de los colores
      relativePath = './utils/vehiclecolor.json';
      absolutePath = path.join(replace(__dirname, 'dist', 'src'), relativePath);
      rawData = fs.readFileSync(absolutePath, 'utf8');
      jsonData = JSON.parse(rawData);
      const formattedDataColor = map(
        filter(
          jsonData,
          (item2) => item2.Color !== null && item2.RGBCode !== '',
        ),
        (item) => {
          return {
            color: item.Color,
            rgbcode: item.RGBCode,
            nameEnglish: item.ColorEnglish,
          };
        },
      );

      const createdColors =
        await this.colorsService.createMany(formattedDataColor);

      //carga de las aseguradoras
      relativePath = './utils/insurance.json';
      absolutePath = path.join(replace(__dirname, 'dist', 'src'), relativePath);
      rawData = fs.readFileSync(absolutePath, 'utf8');
      jsonData = JSON.parse(rawData);
      const formattedDataInsurance = map(
        filter(jsonData, (item2) => item2.InsuranceCompany !== null),
        (item) => {
          return {
            oldId: item.InsuranceID,
            name: item.InsuranceCompany,
            phone: item.InsurancePhone,
            address: item.InsuranceAddress,
          };
        },
      );

      const createdInsurances = await this.insurancesService.createMany(
        formattedDataInsurance,
      );

      return {
        createdMakesModels: `${createdMakesModels.length} marcas y modelos`,
        createdColors: `${createdColors.length} colores`,
        createdInsurances: `${createdInsurances.length} aseguradoras`,
        master,
        workshop,
      };
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
        password: await this.authService.hashPassword('admin123'),
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
