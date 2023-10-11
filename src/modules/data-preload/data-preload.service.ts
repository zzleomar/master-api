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
import { CreateBudgetDto } from '../budgets/dto/create-budget.dto';
import { CreateVehicleDto } from '../vehicles/dto/create-vehicle.dto';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { User } from '../users/entities/user.entity';
import { HistoriesService } from '../histories/histories.service';
import { BudgetsService } from '../budgets/budgets.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class DataPreloadService {
  constructor(
    private readonly userService: UsersService,
    private readonly workshopService: WorkshopsService,
    private readonly authService: AuthService,
    private readonly makesModelsService: MakesModelsService,
    private readonly colorsService: ColorsService,
    private readonly insurancesService: InsurancesService,
    private readonly clientsService: ClientsService,
    private readonly vehiclesService: VehiclesService,
    private readonly budgetsService: BudgetsService,
    private readonly historiesService: HistoriesService,
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
    const insurances = await this.insurancesService.findAll();
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
      const contizadorData = await this.userService.create(cotizador);
      const recepcion: CreateUserDto = {
        firstName: 'Luisa',
        lastName: 'Gomez',
        email: 'recepcion@prueba.com',
        cell: '8338848',
        role: 'Recepcion',
        password: await this.authService.hashPassword('recepcion123'),
        workshop: workshops[0].id,
      };
      const recepcionData = await this.userService.create(recepcion);
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
      const budgetTest1 = await this.loadBudgetsTest(
        {
          fullName: 'Leomar Esparragoza',
          documentType: 'Cedula',
          document: '12345',
          address: 'al lado por alli mismo',
          email: 'co@asdsa.com',
          phone: 78123123,
          cell: 78123777,
          workshop: workshops[0].id,
        },
        {
          vehicleMake: 'JENSEN',
          model: 'HEALEY',
          year: 1994,
          color: 'VERDE LIMON',
          colorType: 'Perlado',
          plate: 'RE1234',
        },
        {
          insuranceCompany: insurances[0].id,
          quoter: contizadorData.id,
        },
        recepcionData,
      );
      const budgetTest2 = await this.loadBudgetsTest(
        {
          fullName: 'Samuel Barreto',
          documentType: 'Cedula',
          document: '543221',
          address: 'al lado por alli mismo',
          email: 'co@asdsa.com',
          phone: 78123123,
          cell: 78123777,
          workshop: workshops[0].id,
        },
        {
          vehicleMake: 'TOYOTA',
          model: 'FJ CRUISER',
          year: 1994,
          color: 'CAQUI OSCURO',
          colorType: 'Perlado',
          plate: 'RE1234',
        },
        {
          insuranceCompany: insurances[0].id,
          quoter: contizadorData.id,
        },
        recepcionData,
      );
      return {
        admin,
        cotizador,
        recepcion,
        repuesto,
        budgetTest1,
        budgetTest2,
      };
    }
    return 'datos ya cargados';
  }

  async loadBudgetsTest(
    createClientDto: CreateClientDto,
    createVehicleDto: CreateVehicleDto,
    createBudgetDto: CreateBudgetDto,
    user: User,
  ) {
    const newClient = await this.clientsService.create(createClientDto);
    createBudgetDto.client = newClient.id;
    await this.historiesService.createHistory({
      message: `Registro de un nuevo cliente`,
      user: user._id,
      client: newClient.id,
    });
    createVehicleDto.workshop = createClientDto.workshop;
    createVehicleDto.owner = createBudgetDto.client;
    const newVehicle = await this.vehiclesService.create(createVehicleDto);
    await this.historiesService.createHistory({
      message: `Registro de un nuevo vehiculo`,
      user: user._id,
      vehicle: newVehicle.id,
    });
    createBudgetDto.vehicle = newVehicle.id;
    createBudgetDto.workshop = createClientDto.workshop;
    const newBufget = await this.budgetsService.create(createBudgetDto);
    const log = await this.historiesService.createHistory({
      message: `Creación del presupuesto ${newBufget.code
        .toString()
        .padStart(6, '0')}`,
      user: user._id,
      budget: newBufget.id,
    });
    newBufget.history.push(log.id);
    newBufget.save();
    return newBufget;
  }
}
