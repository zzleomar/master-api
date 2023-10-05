import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'workshops', timestamps: true })
export class Workshop extends Document {
  @Prop()
  name: string;

  @Prop()
  url: string;

  @Prop({ type: String, ref: 'User' }) // Referencia al usuario propietario
  owner: string; // Aquí deberías almacenar el _id del usuario propietario

  constructor(partial: Partial<Workshop>) {
    super();
    Object.assign(this, partial);
  }
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);
