import { Insurance } from './../../insurances/entities/insurance.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Client } from 'src/modules/clients/entities/client.entity';
import { Vehicle } from 'src/modules/vehicles/entities/vehicle.entity';

export enum StatusBudget {
  Espera = 'Espera',
  Estimado = 'Estimado',
  Aprobado = 'Aprobado',
}

export enum TypeBudget {
  Principal = 'Principal',
  Suplemento = 'Suplemento',
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
export class Budget extends Document {
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
  history: Array<History>;

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
  statusChange: Array<StatusChangeBudget>;

  @Prop({ type: Object })
  inspection: Inspection;

  @Prop()
  comment: string;

  @Prop({ default: 0 })
  tax: number;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
