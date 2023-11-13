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
import { CreateVehicleDto } from '../vehicles/dto/create-vehicle.dto';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { User } from '../users/entities/user.entity';
import { HistoriesService } from '../histories/histories.service';
import { BudgetsService } from '../budgets/budgets.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ClientsService } from '../clients/clients.service';
import { PartsService } from '../parts/parts.service';
import { Budget, StatusBudget } from '../budgets/entities/budget.entity';
import { RepairOrdersService } from '../repair-orders/repair-orders.service';
import { Types } from 'mongoose';

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
    private readonly repairOrdersService: RepairOrdersService,
    private readonly historiesService: HistoriesService,
    private readonly partsService: PartsService,
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

      //carga de las partes
      relativePath = './utils/parts.json';
      absolutePath = path.join(replace(__dirname, 'dist', 'src'), relativePath);
      rawData = fs.readFileSync(absolutePath, 'utf8');
      jsonData = JSON.parse(rawData);
      const formattedDataParts = map(jsonData, (item) => {
        return {
          name: item.name,
          side: item.side,
        };
      });

      const createdParts =
        await this.partsService.createMany(formattedDataParts);

      return {
        createdMakesModels: `${createdMakesModels.length} marcas y modelos`,
        createdColors: `${createdColors.length} colores`,
        createdInsurances: `${createdInsurances.length} aseguradoras`,
        createdParts: `${createdParts.length} partes`,
        master,
        workshop,
      };
    }
    return 'workshop ya registrado';
  }

  async loadDataTest() {
    const workshops = await this.workshopService.findAll();
    const users = await this.userService.findAll(null);
    const insurances = await this.insurancesService.findAll();
    const insurancesParticular = await this.insurancesService.findBy({
      name: 'Particular',
    });
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
      await this.userService.create(admin);
      const cotizador2: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Torres',
        email: 'juan@prueba.com',
        cell: '8338226',
        role: 'Cotizador',
        password: await this.authService.hashPassword('juan123'),
        workshop: workshops[0].id,
      };
      await this.userService.create(cotizador2);
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
      let budgetTest1 = await this.loadBudgetsTest(
        {
          fullName: 'Leomar Esparragoza',
          documentType: 'Cédula',
          document: '12345',
          address: 'al lado por alli mismo',
          email: 'co@asdsa.com',
          phone: 781231123,
          cell: 78123777,
          workshop: workshops[0].id,
        },
        {
          vehicleMake: 'JENSEN',
          vehicleModel: 'HEALEY',
          year: 1994,
          color: 'VERDE LIMON',
          colorType: 'Tricapa perla especial',
          plate: 'RE12H4',
        },
        {
          insuranceCompany: insurances[0],
          quoter: contizadorData,
        },
        recepcionData,
      );
      let budgetTest2 = await this.loadBudgetsTest(
        {
          fullName: 'Samuel Barreto',
          documentType: 'Cédula',
          document: '543221',
          address: 'al lado por alli mismo',
          email: 'co@asdsa.com',
          phone: 781231123,
          cell: 78123777,
          workshop: workshops[0].id,
        },
        {
          vehicleMake: 'TOYOTA',
          vehicleModel: 'FORTUNER',
          year: 1994,
          color: 'CAQUI OSCURO',
          colorType: 'Tricapa',
          plate: 'RE1234',
        },
        {
          insuranceCompany: insurances[0],
          quoter: contizadorData,
        },
        recepcionData,
      );
      const budgetTest3 = await this.loadBudgetsTest(
        budgetTest2.clientData,
        budgetTest2.vehicle,
        {
          insuranceCompany: insurances[1],
          quoter: contizadorData,
        },
        recepcionData,
        'express',
      );

      let budgetTest4 = await this.loadBudgetsTest(
        budgetTest2.clientData,
        budgetTest2.vehicle,
        {
          insuranceCompany: insurancesParticular[0],
          quoter: contizadorData,
        },
        recepcionData,
        'express',
      );

      let budgetTest5 = await this.loadBudgetsTest(
        budgetTest2.clientData,
        budgetTest2.vehicle,
        {
          insuranceCompany: insurancesParticular[0],
          quoter: contizadorData,
        },
        recepcionData,
        'express',
      );

      let budgetTest6 = await this.loadBudgetsTest(
        budgetTest2.clientData,
        budgetTest2.vehicle,
        {
          insuranceCompany: insurances[2],
          quoter: contizadorData,
        },
        recepcionData,
        'express',
      );

      const piece1 = await this.partsService.findOne({ name: 'Tapa de Baul' });
      const piece2 = await this.partsService.findOne({
        name: 'Tapa central defensa trasera',
      });
      const piece3 = await this.partsService.findOne({
        name: 'Molduras y clips delantero izquierdo',
      });
      const piece4 = await this.partsService.findOne({
        name: 'Radiador de  agua',
      });
      this.budgetsService.saveInspection(budgetTest1, {
        budgetId: budgetTest1.id,
        documents: [],
        photos: [
          'https://loscoches.com/wp-content/uploads/2021/05/taller-de-carros-autorizado.jpg',
          'https://motor.elpais.com/wp-content/uploads/2017/09/timos_talleres.jpg',
          'https://motor.elpais.com/wp-content/uploads/2022/02/taller-2-1046x616.jpg',
        ],
        others: [
          {
            other: 'balancear',
            comment: '',
            price: 200,
          },
        ],
        pieces: [
          {
            side: 'Parte Trasera',
            operation: 'Reparar y pintar',
            piece: piece1,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Trasera',
            operation: 'Cambiar y pintar',
            piece: piece2,
            comment: '',
            price: 0,
          },
          {
            side: 'Lado Izquierdo',
            operation: 'Reparar',
            piece: piece3,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Frontal',
            operation: 'Cambiar',
            piece: piece4,
            comment: 'llego no funcional',
            price: 100,
          },
        ],
        comment: 'comentario general de la reparaci[on',
        tax: 0,
      });

      budgetTest2 = await this.budgetsService.saveInspection(budgetTest2, {
        budgetId: budgetTest2.id,
        documents: [],
        photos: [
          'https://loscoches.com/wp-content/uploads/2021/05/taller-de-carros-autorizado.jpg',
          'https://motor.elpais.com/wp-content/uploads/2017/09/timos_talleres.jpg',
          'https://motor.elpais.com/wp-content/uploads/2022/02/taller-2-1046x616.jpg',
        ],
        others: [
          {
            other: 'balancear',
            comment: '',
            price: 200,
          },
        ],
        pieces: [
          {
            side: 'Parte Trasera',
            operation: 'Reparar y pintar',
            piece: piece1,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Trasera',
            operation: 'Cambiar y pintar',
            piece: piece2,
            comment: '',
            price: 0,
          },
          {
            side: 'Lado Izquierdo',
            operation: 'Reparar',
            piece: piece3,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Frontal',
            operation: 'Cambiar',
            piece: piece4,
            comment: 'llego no funcional',
            price: 100,
          },
        ],
        comment: 'comentario general de la reparaci[on',
        tax: 0,
      });

      budgetTest4 = await this.budgetsService.saveInspection(budgetTest4, {
        budgetId: budgetTest4.id,
        documents: [],
        photos: [
          'https://loscoches.com/wp-content/uploads/2021/05/taller-de-carros-autorizado.jpg',
          'https://motor.elpais.com/wp-content/uploads/2017/09/timos_talleres.jpg',
          'https://motor.elpais.com/wp-content/uploads/2022/02/taller-2-1046x616.jpg',
        ],
        others: [
          {
            other: 'balancear',
            comment: '',
            price: 200,
          },
        ],
        pieces: [
          {
            side: 'Parte Trasera',
            operation: 'Cambiar',
            piece: piece1,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Trasera',
            operation: 'Cambiar y pintar',
            piece: piece2,
            comment: '',
            price: 0,
          },
          {
            side: 'Lado Izquierdo',
            operation: 'Reparar',
            piece: piece3,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Frontal',
            operation: 'Cambiar',
            piece: piece4,
            comment: 'llego no funcional',
            price: 100,
          },
        ],
        comment: 'comentario general de la reparaci[on',
        tax: 0,
      });

      this.budgetsService.saveInspection(budgetTest5, {
        budgetId: budgetTest5.id,
        documents: [],
        photos: [
          'https://loscoches.com/wp-content/uploads/2021/05/taller-de-carros-autorizado.jpg',
          'https://motor.elpais.com/wp-content/uploads/2017/09/timos_talleres.jpg',
          'https://motor.elpais.com/wp-content/uploads/2022/02/taller-2-1046x616.jpg',
        ],
        others: [
          {
            other: 'balancear',
            comment: '',
            price: 200,
          },
        ],
        pieces: [
          {
            side: 'Parte Trasera',
            operation: 'Reparar y pintar',
            piece: piece1,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Trasera',
            operation: 'Reparar y pintar',
            piece: piece2,
            comment: '',
            price: 0,
          },
          {
            side: 'Lado Izquierdo',
            operation: 'Reparar',
            piece: piece3,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Frontal',
            operation: 'Cambiar',
            piece: piece4,
            comment: 'llego no funcional',
            price: 100,
          },
        ],
        comment: 'comentario general de la reparaci[on',
        tax: 0,
      });

      budgetTest6 = await this.budgetsService.saveInspection(budgetTest6, {
        budgetId: budgetTest6.id,
        documents: [],
        photos: [
          'https://loscoches.com/wp-content/uploads/2021/05/taller-de-carros-autorizado.jpg',
          'https://motor.elpais.com/wp-content/uploads/2017/09/timos_talleres.jpg',
          'https://motor.elpais.com/wp-content/uploads/2022/02/taller-2-1046x616.jpg',
        ],
        others: [
          {
            other: 'balancear',
            comment: '',
            price: 200,
          },
        ],
        pieces: [
          {
            side: 'Parte Trasera',
            operation: 'Reparar y pintar',
            piece: piece1,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Trasera',
            operation: 'Cambiar y pintar',
            piece: piece2,
            comment: '',
            price: 0,
          },
          {
            side: 'Lado Izquierdo',
            operation: 'Reparar',
            piece: piece3,
            comment: '',
            price: 0,
          },
          {
            side: 'Parte Frontal',
            operation: 'Cambiar',
            piece: piece4,
            comment: 'llego no funcional',
            price: 100,
          },
        ],
        comment: 'comentario general de la reparaci[on',
        tax: 0,
      });

      budgetTest1 = await this.budgetsService.updateStatus(
        budgetTest1,
        StatusBudget.Espera,
        StatusBudget.Estimado,
        recepcionData,
      );

      budgetTest2 = await this.budgetsService.updateStatus(
        budgetTest2,
        StatusBudget.Espera,
        StatusBudget.Estimado,
        recepcionData,
      );

      budgetTest4 = await this.budgetsService.updateStatus(
        budgetTest4,
        StatusBudget.Espera,
        StatusBudget.Estimado,
        recepcionData,
      );

      budgetTest5 = await this.budgetsService.updateStatus(
        budgetTest5,
        StatusBudget.Espera,
        StatusBudget.Estimado,
        recepcionData,
      );

      budgetTest6 = await this.budgetsService.updateStatus(
        budgetTest6,
        StatusBudget.Espera,
        StatusBudget.Estimado,
        recepcionData,
      );

      this.expiredBudget(budgetTest4);
      this.expiredBudget(budgetTest5);
      this.expiredBudget(budgetTest6);

      const order1 = await this.repairOrdersService.create(
        {
          budgetId: budgetTest1.id,
          approved: false,
          inTheWorkshop: true,
          workshop: new Types.ObjectId(recepcion.workshop),
        },
        budgetTest1,
        recepcionData,
      );

      const order2 = await this.repairOrdersService.create(
        {
          budgetId: budgetTest2.id,
          approved: true,
          inTheWorkshop: false,
          workshop: new Types.ObjectId(recepcion.workshop),
        },
        budgetTest2,
        recepcionData,
      );

      const order3 = await this.repairOrdersService.create(
        {
          budgetId: budgetTest4.id,
          approved: true,
          inTheWorkshop: false,
          workshop: new Types.ObjectId(recepcion.workshop),
        },
        budgetTest4,
        recepcionData,
      );

      return {
        admin,
        cotizador,
        recepcion,
        repuesto,
        budgetTest1,
        budgetTest2,
        budgetTest3,
        budgetTest4,
        budgetTest5,
        budgetTest6,
        order1,
        order2,
        order3,
      };
    }
    return 'datos ya cargados';
  }

  async expiredBudget(budgetData: Budget) {
    if (budgetData.insuranceData.name === 'Particular') {
      await this.budgetsService.expited(budgetData, 30);
    } else {
      await this.budgetsService.expited(budgetData, 60);
    }
  }

  async loadBudgetsTest(
    createClientDto: any,
    createVehicleDto: any,
    createBudgetDto: any,
    user: User,
    mode: string = 'normal',
  ) {
    if (mode === 'normal') {
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
      createBudgetDto.vehicle = newVehicle;
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
    } else {
      createBudgetDto.client = createClientDto.id;
      createBudgetDto.vehicle = createVehicleDto;
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

  async loadClient() {
    const workshops = await this.workshopService.findAll();
    const clients = await this.clientsService.findAll();

    if (workshops.length > 0 && clients.length === 0) {
      const client1: CreateClientDto = {
        fullName: 'Pedro Fuentes',
        documentType: 'Cédula',
        document: '24001001',
        address: 'cumana',
        email: 'client1@email.com',
        phonePrefix: '+58',
        phone: 4120102123,
        cellPrefix: '+58',
        cell: 2930102123,
        workshop: workshops[0].id,
      };
      await this.clientsService.create(client1);

      const client2: CreateClientDto = {
        fullName: 'Jose Carvajal',
        documentType: 'Cédula',
        document: '24001011',
        address: 'cumana',
        email: 'client2@email.com',
        phonePrefix: '+58',
        phone: 4120102456,
        cellPrefix: '+58',
        cell: 2930102456,
        workshop: workshops[0].id,
      };
      await this.clientsService.create(client2);

      const client3: CreateClientDto = {
        fullName: 'Pedro Fuentes',
        documentType: 'Cédula',
        document: '24001001',
        address: 'cumana',
        email: 'client3@email.com',
        phonePrefix: '+58',
        phone: 4120102789,
        cellPrefix: '+58',
        cell: 2930102789,
        workshop: workshops[0].id,
      };
      await this.clientsService.create(client3);

      return {
        client1,
        client2,
        client3,
      };
    }
    return 'datos ya cargados';
  }

  async loadVehicle() {
    const workshops = await this.workshopService.findAll();
    const clients = await this.clientsService.findAll();
    const vehicles = await this.vehiclesService.findAll();

    if (workshops.length > 0 && clients.length > 0 && vehicles.length == 0) {
      const car1: CreateVehicleDto = {
        vehicleMake: 'porshe',
        vehicleModel: 'MONTA CARGA',
        year: 1994,
        color: 'red',
        colorType: 'brillo',
        chassis: '',
        plate: 'mega10',
        mileage: 12000,
        workshop: workshops[0].id,
        owner: clients[0].id,
      };
      await this.vehiclesService.create(car1);

      const car2: CreateVehicleDto = {
        vehicleMake: 'porshe',
        vehicleModel: 'CF-506',
        year: 1995,
        color: 'blue',
        colorType: 'mate',
        chassis: '',
        plate: 'mega11',
        mileage: 13540,
        workshop: workshops[0].id,
        owner: clients[1].id,
      };
      await this.vehiclesService.create(car2);

      const car3: CreateVehicleDto = {
        vehicleMake: 'misubichi',
        vehicleModel: 'CF-486',
        year: 1985,
        color: 'red',
        colorType: 'red',
        chassis: '',
        plate: 'mega20',
        mileage: 12387,
        workshop: workshops[0].id,
        owner: clients[2].id,
      };
      await this.vehiclesService.create(car3);

      return {
        car1,
        car2,
        car3,
      };
    }
    return 'datos ya cargados';
  }
}
