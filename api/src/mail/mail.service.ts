import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { User } from '@prisma/client';

// Service encargado de TODOS los correos de la app.
// En desarrollo envía a Mailpit; en producción usará un SMTP real
// solo cambiando variables de entorno (el código no cambia).
@Injectable()
export class MailService {
  // "transporter" = el cartero: la conexión al servidor SMTP
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'), // localhost
      port: Number(this.config.get('SMTP_PORT')), // 1026 (Mailpit de este proyecto)
      secure: false, // sin TLS en desarrollo
      // Mailpit no pide usuario/contraseña; en producción
      // aquí agregarías user/pass desde el .env
    });
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

  // Correo específico: "verifica tu cuenta"
  async sendVerificationEmail(user: User, token: string) {
    // El link apunta a la API para poder probarlo YA sin frontend.
    // Cuando exista la app móvil/web, apuntará a WEB_URL.
    const url = `${this.config.get('API_URL')}/api/v1/auth/verify-email?token=${token}`;

    await this.sendMail(
      user.email,
      '🎵 Verifica tu correo en Mi SetList',
      `
      <h1>Bienvenido a Mi SetList, ${user.name}</h1>
      <p>Haz clic en el siguiente enlace para verificar tu correo:</p>
      <p><a href="${url}">Verificar mi correo</a></p>
      <p>Este enlace expira en 24 horas.</p>
      `,
    );
  }
}
