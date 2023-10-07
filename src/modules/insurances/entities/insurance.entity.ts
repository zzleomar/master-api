import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'insurances', timestamps: true })
export class Insurance extends Document {
  @Prop()
  oldId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;
}

export const InsurancesSchema = SchemaFactory.createForClass(Insurance);
