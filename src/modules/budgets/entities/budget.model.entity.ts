import { Insurance } from './../../insurances/entities/insurance.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Client } from '../../clients/entities/client.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import * as moment from 'moment';

export enum StatusBudget {
  Espera = 'Esp. Aprob.',
  Estimado = 'Estimado',
  Aprobado = 'Aprobado',
  Expirado = 'Expirado',
}

export enum TypeBudget {
  Principal = 'Principal',
  Suplemento = 'Suplemento',
}

export enum TypeSupplement {
  A = 'Adicionales',
  M = 'Mecanica',
  O = 'Otros',
}

interface StatusChangeBudget {
  initDate: Date;
  endDate: Date;
  status: StatusBudget;
}

interface Inspection {
  pieces: object[];
  others: object[];
  photos: string[];
  documents: string[];
  created: Date;
  updated: Date;
}

@Schema({ timestamps: true })
export class BudgetModel extends Document {
  @Prop({ required: true, unique: false }) // Permitir duplicados
  code: number;

  @Prop({
    type: String,
    enum: StatusBudget,
    required: true,
    default: 'Estimado',
  })
  status: StatusBudget;

  @Prop({
    type: String,
    enum: TypeBudget,
    required: true,
    default: 'Principal',
  })
  type: TypeBudget;

  @Prop({
    type: String,
    enum: TypeSupplement,
    required: false,
  })
  typeSupplement: TypeSupplement;

  @Prop({
    type: Number,
    required: false,
    default: 0,
  })
  numberSupplement: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Vehicle' })
  vehicle: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Workshop' })
  workshop: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Client' })
  client: Types.ObjectId;

  @Prop({ type: Client, required: true })
  clientData: Client;

  @Prop({ type: Vehicle, required: true })
  vehicleData: Vehicle;

  @Prop()
  history: Array<any>;
  // history: Array<History>;

  @Prop()
  claimNumber: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Insurance' })
  insuranceCompany: Types.ObjectId;

  @Prop({ required: true, type: Insurance })
  insuranceData: Insurance;

  @Prop()
  adjuster: string;

  @Prop()
  adjusterEmail: string;

  @Prop({ default: '+507' })
  adjusterCellPrefix: string;

  @Prop()
  adjusterCell: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  quoter: Types.ObjectId;

  @Prop()
  statusChange: StatusChangeBudget[];

  @Prop({ type: Object })
  inspection: Inspection;

  @Prop()
  comment: string;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: new Date(moment().toISOString()) })
  creationDate: Date;

  @Prop({ default: false })
  oldData: boolean;

}

export const BudgetSchema = SchemaFactory.createForClass(BudgetModel);
