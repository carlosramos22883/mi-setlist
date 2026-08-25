import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { User } from '@prisma/client';
import { designTokens as t } from '../common/design-tokens';
import { emailButton, emailLayout } from './email-template';

// Service encargado de TODOS los correos de la app.
// En desarrollo envía a Mailpit; en producción usará un SMTP real
// solo cambiando variables de entorno (el código no cambia).
@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT')),
      secure: false,
    });
  }

  // URL pública del logo que sirve la API (con el prefijo /api/v1)
  private logoUrl(): string {
    return `${this.config.get('API_URL')}/api/v1/public/logo`;
  }

  // Método genérico: cualquier correo pasa por aquí
  async sendMail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject,
      html,
    });
  }

  // Correo de VERIFICACIÓN de cuenta
  async sendVerificationEmail(user: User, token: string) {
    const url = `${this.config.get('API_URL')}/api/v1/auth/verify-email?token=${token}`;

    const content = `
      <p style="color:${t.textSecondary};">
        Hola, <strong>${user.name}</strong>. Haz clic en el botón para verificar tu correo:
      </p>
      <p style="text-align:center; margin:20px 0;">
        ${emailButton(url, 'Verificar mi correo')}
      </p>
      <p style="font-size:12px; color:${t.textMuted};">Este enlace expira en 24 horas.</p>
    `;

    await this.sendMail(
      user.email,
      '🎵 Verifica tu correo en Mi SetList',
      emailLayout('Bienvenido a Mi SetList', content, this.logoUrl()),
    );
  }

  // Correo de RECUPERACIÓN de contraseña
  async sendPasswordResetEmail(user: User, token: string) {
    // El link apunta a la WEB: allí estará la pantalla "Nueva contraseña"
    const url = `${this.config.get('WEB_URL')}/reset-password?token=${token}`;

    const content = `
      <p style="color:${t.textSecondary};">
        Hola, <strong>${user.name}</strong>. Recibimos una solicitud para
        restablecer tu contraseña:
      </p>
      <p style="text-align:center; margin:20px 0;">
        ${emailButton(url, 'Restablecer contraseña')}
      </p>
      <p style="font-size:12px; color:${t.textMuted};">
        Este enlace expira en 1 hora. Si no fuiste tú, ignora este correo.
      </p>
    `;

    await this.sendMail(
      user.email,
      '🔐 Restablece tu contraseña de Mi SetList',
      emailLayout('Recuperación de contraseña', content, this.logoUrl()),
    );
  }
}
