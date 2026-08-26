import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  // Inyección de dependencias: BD, JWT, config y correo
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // =====================================================
  // REGISTRO
  // =====================================================
  async register(dto: RegisterDto) {
    // 1) ¿El correo ya existe? → 409 Conflict
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Ese correo ya está registrado');

    // 2) Hashear la contraseña (costo 10 = 2^10 rondas de bcrypt)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3) Crear el usuario con el rol "Usuario" por defecto
    // (el usuario NO elige su rol al registrarse)
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'Usuario' },
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        // Si existe el rol Usuario, lo asignamos; si no, sin rol
        roles: defaultRole
          ? { create: [{ roleId: defaultRole.id }] }
          : undefined,
      },
    });

    // 4) Token de verificación de correo:
    //    el "crudo" viaja en el link; en BD guardamos el hash
    const rawToken = randomBytes(32).toString('hex'); // 64 caracteres aleatorios
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    // 5) Enviar el correo (lo verás en Mailpit :8026)
    await this.mail.sendVerificationEmail(user, rawToken);

    // 6) Emitir tokens para que quede logueado de una vez
    const tokens = await this.issueTokens(user.id);

    return { user: await this.enrichedUser(user.id), ...tokens };
  }

  // =====================================================
  // LOGIN
  // =====================================================
  async login(dto: LoginDto) {
    // 1) Buscar al usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Mensaje genérico a propósito: no decimos "el correo no existe"
    // vs "contraseña mala" (evita que adivinen cuentas registradas)
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2) Comparar contraseña contra el hash guardado
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    // 3) Emitir tokens
    const tokens = await this.issueTokens(user.id);
    // 🆒 ahora el usuario llega CON roles y permisos (sin recargar)
    return { user: await this.enrichedUser(user.id), ...tokens };
  }

  // =====================================================
  // REFRESH (rotación de tokens)
  // =====================================================
  async refresh(rawRefresh: string) {
    // 1) Buscar el token en BD por su hash
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawRefresh) },
    });

    // 2) Debe existir, no estar revocado y no estar expirado
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // 3) Además verificamos la firma JWT (doble seguridad)
    try {
      await this.jwt.verifyAsync(rawRefresh, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // 4) ROTACIÓN: el token viejo muere y se emite uno nuevo.
    //    Si alguien roba un refresh token y lo usa dos veces,
    //    la segunda falla → y podemos detectar el robo.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId);
  }

  // =====================================================
  // LOGOUT
  // =====================================================
  async logout(userId: string, rawRefresh?: string) {
    if (rawRefresh) {
      // Revocar solo el token enviado
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(rawRefresh), userId },
        data: { revokedAt: new Date() },
      });
    } else {
      // "Cerrar sesión en todos lados": revocar todos sus tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Sesión cerrada' };
  }

  // =====================================================
  // PERFIL DEL USUARIO AUTENTICADO (con roles y permisos)
  // =====================================================
  async me(userId: string) {
    return this.enrichedUser(userId);
  }

  // =====================================================
  // VERIFICACIÓN DE CORREO
  // =====================================================
  async verifyEmail(rawToken: string) {
    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });

    // Debe existir, no haberse usado y no estar expirado
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    // Transacción: o pasan las dos cosas, o ninguna
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Correo verificado correctamente 🎉' };
  }

  // =====================================================
  // OLVIDÉ MI CONTRASEÑA
  // =====================================================
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Respuesta idéntica exista o no el correo (no revelamos cuentas)
    const generic = {
      message: 'Si el correo existe, te enviamos las instrucciones',
    };
    if (!user) return generic;

    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    await this.mail.sendPasswordResetEmail(user, rawToken);
    return generic;
  }

  // =====================================================
  // RESTABLECER CONTRASEÑA (con token del correo)
  // =====================================================
  async resetPassword(rawToken: string, newPassword: string) {
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Transacción: nueva contraseña + token usado + cerrar TODAS las sesiones
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña',
    };
  }

  // =====================================================
  // HELPERS PRIVADOS
  // =====================================================

  // Emite access + refresh token y guarda el refresh hasheado en BD
  private async issueTokens(userId: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId }, // "sub" = subject: el id del usuario
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'), // 15m
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'), // 7d
      },
    );

    // Guardamos el refresh HASHEADO con su expiración
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    return { accessToken, refreshToken };
  }

  // sha256 para hashear tokens (bcrypt es para contraseñas)
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Quita el hash de contraseña antes de devolver el usuario
  private publicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // =====================================================
  // HELPER: usuario público + roles + permisos
  // =====================================================
  // Única fuente de verdad del "usuario enriquecido".
  // Lo usan me(), login() y register() para que TODOS
  // devuelvan la misma forma de datos.
  private async enrichedUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.name),
        ),
      ),
    ];

    return { ...this.publicUser(user), roles, permissions };
  }
}
