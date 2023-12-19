import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'parts', timestamps: true })
export class Part extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  side: string;

  @Prop({ default: true })
  status: boolean;
}

export const PartsSchema = SchemaFactory.createForClass(Part);
