import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'makesModels', timestamps: true })
export class MakesModels extends Document {
  @Prop({ required: true })
  make: string;

  @Prop({ default: true })
  status: boolean;

  @Prop([
    {
      model: { type: String, required: true },
      status: { type: Boolean, default: true },
      year: { type: String },
      paint: { type: String },
    },
  ])
  models: { model: string; status: boolean; year: string; paint: string }[];
}

export const MakesModelsSchema = SchemaFactory.createForClass(MakesModels);
