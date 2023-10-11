import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Client } from 'src/modules/clients/entities/client.entity';

export enum StatusBudget {
  Espera,
  Estimado,
  Aprobado,
}

export enum TypeBudget {
  Principal,
  Suplemento,
}

interface StatusChangeBudget {
  initDate: Date;
  endDate: Date;
  status: StatusBudget;
}

@Schema({ timestamps: true })
export class Budget extends Document {
  @Prop({ required: true, unique: false }) // Permitir duplicados
  code: number;

  @Prop({ type: String, enum: StatusBudget, required: true, default: 'Espera' })
  status: [StatusBudget];

  @Prop({
    type: String,
    enum: TypeBudget,
    required: true,
    default: 'Principal',
  })
  type: [TypeBudget];

  @Prop({ required: true, type: String, ref: 'Vehicle' })
  vehicle: string;

  @Prop({ required: true, type: String, ref: 'Workshop' })
  workshop: string;

  @Prop({ required: true, type: String, ref: 'Client' })
  client: string;

  @Prop({ type: Client, required: true })
  clientData: Client;

  @Prop()
  history: Array<History>;

  @Prop()
  claimNumber: string;

  @Prop({ required: true, type: String, ref: 'Insurance' })
  insuranceCompany: string;

  @Prop()
  adjuster: string;

  @Prop()
  adjusterEmail: string;

  @Prop({ default: '+507' })
  adjusterCellPrefix: string;

  @Prop()
  adjusterCell: number;

  @Prop({ required: true, type: String, ref: 'User' })
  quoter: string;

  @Prop()
  statusChange: Array<StatusChangeBudget>;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
