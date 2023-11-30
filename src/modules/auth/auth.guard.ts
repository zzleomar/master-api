import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import {
  IS_ADMIN,
  IS_COTIZADOR,
  IS_SUPERADMIN,
  IS_MASTER,
  IS_RECEPCION,
  IS_REPUESTO,
} from './utils/decorator';
import { some } from 'lodash';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isSuperAdmin = this.reflector.get<boolean>(
      IS_SUPERADMIN,
      context.getHandler(),
    );
    const isMaster = this.reflector.get<boolean>(
      IS_MASTER,
      context.getHandler(),
    );
    const isAdmin = this.reflector.get<boolean>(IS_ADMIN, context.getHandler());
    const isRecepcion = this.reflector.get<boolean>(
      IS_RECEPCION,
      context.getHandler(),
    );
    const isRepuesto = this.reflector.get<boolean>(
      IS_REPUESTO,
      context.getHandler(),
    );
    const isCotizador = this.reflector.get<boolean>(
      IS_COTIZADOR,
      context.getHandler(),
    );

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      if (
        !this.validateRole(
          {
            Master: isMaster,
            Admin: isAdmin,
            SuperAdmin: isSuperAdmin,
            Cotizador: isCotizador,
            Recepcion: isRecepcion,
            Repuesto: isRepuesto,
          },
          payload.role,
        )
      ) {
        throw new UnauthorizedException();
      }
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private validateRole(isRoles: any, role: string): boolean {
    // busco si no existe decorador = true, de no haber ningun decorador quiere decir que el servicio es libre para todos los usuarios
    const notIsAll = some(isRoles, (value: boolean) => value);
    // de existir un decorador = true, retorno si el servicio esta permitido para el role del usuario, de lo contrario retorno true ya que estaria libre para todos los roles
    return notIsAll ? isRoles[role] : true;
  }
}
