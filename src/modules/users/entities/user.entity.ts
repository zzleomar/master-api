import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Role {
  SuperAdmin,
  Master,
  Admin,
  Cotizador,
  Recepcion,
  Repuesto,
}

@Schema({ collection: 'users', timestamps: true })
export class User extends Document {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop({ default: '+507' })
  prefix: string;

  @Prop()
  cell: string;

  @Prop({ default: '+507', nullable: true })
  prefixPhone: string;

  @Prop({ default: '', nullable: true })
  phone: string;

  @Prop({ default: 'https://cdn-icons-png.flaticon.com/512/4975/4975733.png' })
  avatar: string;

  @Prop({ type: String, enum: Role })
  role: [Role];

  @Prop()
  password: string;

  @Prop({ default: null, nullable: true })
  oldId: number;

  @Prop({ default: '' })
  hashReset: string;

  @Prop({ default: true })
  status: boolean;

  @Prop()
  history: Array<any>;

  @Prop({ type: String, ref: 'Workshop' }) // Referencia al workshop al que pertenece
  workshop: string; // Aquí deberías almacenar el _id del workshop
  // si es un supAdmin no tiene workshop

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}

export const UsersSchema = SchemaFactory.createForClass(User);
