import { SetMetadata } from '@nestjs/common';

export const IS_SUPERADMIN = 'isSuperAdmin';
export const SuperAdmin = () => SetMetadata(IS_SUPERADMIN, true);

export const IS_MASTER = 'isMaster';
export const Master = () => SetMetadata(IS_MASTER, true);

export const IS_ADMIN = 'isAdmin';
export const Admin = () => SetMetadata(IS_ADMIN, true);

export const IS_COTIZADOR = 'isCotizador';
export const Cotizador = () => SetMetadata(IS_COTIZADOR, true);

export const IS_RECEPCION = 'isRecepcion';
export const Recepcion = () => SetMetadata(IS_RECEPCION, true);

export const IS_REPUESTO = 'isRepuesto';
export const Repuesto = () => SetMetadata(IS_REPUESTO, true);
