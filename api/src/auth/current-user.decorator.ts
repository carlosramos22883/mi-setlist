import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload';

// "Extendemos" el tipo Request de Express para que tenga
// un `user` TIPADO (en vez de cualquier `any`)
type AuthRequest = Request & { user?: JwtPayload };

// Decorador de parámetro: en el controller escribes
//   @CurrentUser() user: JwtPayload
// y recibes el payload que el guard pegó al request.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user; // tipado: ya no hay "unsafe member access"
  },
);
