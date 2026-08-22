import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { User } from '@prisma/client';
import { emailButton, emailLayout } from './email-template';
import { designTokens as t } from '../common/design-tokens';

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

  async sendMail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject,
      html,
    });
  }

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
      emailLayout('Bienvenido a Mi SetList', content),
    );
  }
}
