import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'makesModels', timestamps: true })
export class MakesModels extends Document {
  @Prop({ required: true })
  make: string;

  @Prop([
    {
      model: { type: String, required: true },
      year: { type: String },
      paint: { type: String },
    },
  ])
  models: { model: string; year: string; paint: string }[];
}

export const MakesModelsSchema = SchemaFactory.createForClass(MakesModels);
