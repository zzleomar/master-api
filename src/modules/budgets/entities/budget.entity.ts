import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';
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

  @Prop({ required: true, type: Types.ObjectId, ref: 'Vehicle' })
  vehicle: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Workshop' })
  workshop: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Client' })
  client: Types.ObjectId;

  @Prop({ type: Client, required: true })
  clientData: Client;

  @Prop()
  history: Array<History>;

  @Prop()
  claimNumber: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Insurance' })
  insuranceCompany: Types.ObjectId;

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
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
