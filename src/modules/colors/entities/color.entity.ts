import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'colors', timestamps: true })
export class Color extends Document {
  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  rgbcode: string;

  @Prop()
  nameEnglish: string;

  @Prop({ default: true })
  status: boolean;
}

export const ColorsSchema = SchemaFactory.createForClass(Color);
