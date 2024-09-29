import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'insurances', timestamps: true })
export class InsuranceModel extends Document {
  @Prop()
  oldId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop({ default: true })
  status: boolean;

  @Prop()
  email: string;

  @Prop()
  fitter: string;
}

export const InsurancesSchema = SchemaFactory.createForClass(InsuranceModel);
