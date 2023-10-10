import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'histories', timestamps: true })
export class History extends Document {
  @Prop({ type: String, ref: 'User', required: true }) // Campo de referencia al usuario
  user: string;

  @Prop({ required: true }) // Descripción de la acción
  message: string;

  @Prop({ type: String, ref: 'Budget' })
  budget: string;

  @Prop({ type: String, ref: 'Vehicle' })
  vehicle: string;

  @Prop({ type: String, ref: 'Client' })
  client: string;
}

export const HistoriesSchema = SchemaFactory.createForClass(History);
