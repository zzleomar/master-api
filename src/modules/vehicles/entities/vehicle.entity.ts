import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'vehicles', timestamps: true })
export class Vehicle extends Document {
  @Prop({ required: true })
  vehicleMake: string;

  @Prop({ required: true })
  vehicleModel: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  colorType: string;

  @Prop()
  chassis: string;

  @Prop({ required: true })
  plate: string;

  @Prop()
  mileage: number;

  @Prop({ required: true, type: String, ref: 'Workshop' })
  workshop: string;

  @Prop({ required: true, type: String, ref: 'Client' })
  owner: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
