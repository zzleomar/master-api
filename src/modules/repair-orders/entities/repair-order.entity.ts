import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Budget } from 'src/modules/budgets/entities/budget.entity';

export enum StatusRepairOrder {
  Abierta = 'Abierta',
  Completada = 'Completada',
  Anulada = 'Anulada',
}

export enum StatusVehicle {
  EsperandoPieza = 'Esperando piezas',
  EsperandoAprobacion = 'Esperando aprobación',
  EsperandoCliente = 'Esperando cliente',
  EsperandoTurno = 'Esperando turno',
  NoSeTrabajo = 'No se trabajó',
}

export enum StatusPiece {
  NoCompro = 'No se compró',
  Recibido = 'Recibido',
  Pedido = 'Pedido',
  Inventario = 'Inventario',
}

interface StatusChange {
  initDate: Date;
  endDate: Date | null;
  status: StatusVehicle | StatusRepairOrder;
}

interface PiecesItem {
  piece: string;
  price: number | null;
  status: StatusPiece | null;
  receptionDate: Date | null;
  provider: string | null;
  comment: string | null;
}

@Schema({ collection: 'repairOrders', timestamps: true })
export class RepairOrder extends Document {
  @Prop({ required: true, unique: true })
  code: number;

  @Prop({ type: Boolean, default: true })
  approved: boolean;

  @Prop({ type: Boolean, default: true })
  inTheWorkshop: boolean;

  @Prop({ type: Boolean, default: false })
  piecesToWork: boolean;

  @Prop({
    type: String,
    enum: StatusRepairOrder,
    required: true,
    default: 'Abierta',
  })
  status: StatusRepairOrder;
  @Prop()
  statusChange: StatusChange[];

  @Prop({
    type: String,
    enum: StatusVehicle,
    required: true,
    default: 'Esperando turno',
  })
  statusVehicle: StatusVehicle;

  @Prop({ type: Array })
  pieces: PiecesItem[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Workshop' })
  workshop: Types.ObjectId;

  @Prop()
  statusChangeVehicle: StatusChange[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'Budget' })
  budget: Types.ObjectId;

  @Prop({ type: Budget, required: true })
  budgetData: Budget;

  @Prop({ type: String, nullable: true, default: '' })
  anullationComment: string;
}

export const RepairOrderSchema = SchemaFactory.createForClass(RepairOrder);
