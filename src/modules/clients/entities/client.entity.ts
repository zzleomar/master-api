import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'clients', timestamps: true })
export class Client extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  document: string;

  @Prop()
  address: string;

  @Prop()
  email: string;

  @Prop({ default: '+507' })
  phonePrefix: string;

  @Prop()
  phone: number;

  @Prop({ default: '+507' })
  cellPrefix: string;

  @Prop()
  cell: number;

  @Prop({ required: true, type: String, ref: 'Workshop' })
  workshop: string;

  constructor(partial: Partial<Client>) {
    super();
    Object.assign(this, partial);
  }
}

export const ClientsSchema = SchemaFactory.createForClass(Client);
