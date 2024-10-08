import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Budget } from '../../budgets/entities/budget.entity';

export enum StatusRepairOrder {
  Abierta = 'Abierta',
  Completada = 'Completada',
  Anulada = 'Anulada',
  Garantia = 'Garantía',
}

export enum StatusVehicle {
  EsperandoPieza = 'Esperando piezas',
  EsperandoAprobacion = 'Esperando aprobación',
  EsperandoCliente = 'Esperando cliente',
  EsperandoTurno = 'Esperando turno',
  NoSeTrabajo = 'No se trabajó',
  Enderezado = 'Enderezado',
  Preparacion = 'Preparación',
  Pintura = 'Pintura',
  Armado = 'Armado',
  Mecanica = 'Mecánica',
  Alineamiento = 'Alineamiento',
  Acondicionado = 'A. Acondicionado',
  Detalle = 'Detalle',
  PiezasPend = 'T. c/piezas pend.',
  SinEntregar = 'T. sin entregar',
  Terminado = 'Terminado',
  TGarantia = 'T. Garantía',
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

export interface PiecesItem {
  piece: string;
  price?: number | null;
  status?: StatusPiece | null;
  receptionDate: Date | null;
  provider?: string | null;
  comment?: string | null;
}

@Schema({ collection: 'repairOrders', timestamps: true })
export class RepairOrderModel extends Document {
  @Prop({ required: true })
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

  @Prop({ type: String, nullable: true, default: '' })
  anullationDate: string;

  @Prop({ type: Date, nullable: true, default: null })
  initOT: Date;

  @Prop({ type: Date, nullable: true, default: null })
  endOT: Date;

  @Prop({ type: Date, nullable: true, default: null })
  initWarranty: Date;

  @Prop({ type: Date, nullable: true, default: null })
  endWarranty: Date;

  @Prop({ type: String, nullable: true, default: '' })
  commentWarranty: string;

  @Prop({ type: Number, nullable: true, default: null })
  numberWarranty: number;

  @Prop({ type: String, nullable: true, default: null })
  masterRo: string;
}

export const RepairOrderSchema = SchemaFactory.createForClass(RepairOrderModel);
