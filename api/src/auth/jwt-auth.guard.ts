import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from './jwt-payload';

// Request con nuestro usuario tipado
type AuthRequest = Request & { user?: JwtPayload };

// El "portero": deja pasar solo peticiones con Bearer token válido
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    // 1) Sacar el token del header "Authorization: Bearer <token>"
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('No autenticado');

    try {
      // 2) Verificar firma y expiración.
      //    El <JwtPayload> le dice a TS qué forma tiene el resultado:
      //    así evitamos el "any" y el warning de unsafe-call/return
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      // 3) Pegar el payload TIPADO al request (sin `as any`)
      request.user = payload;
      return true; // pasa
    } catch {
      throw new UnauthorizedException('Token inválido o expirado'); // 401
    }
  }

  private extractToken(request: Request): string | null {
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    return type === 'Bearer' ? token : null;
  }
}
