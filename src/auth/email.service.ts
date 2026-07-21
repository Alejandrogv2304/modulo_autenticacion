import {Injectable} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
@Injectable()
export class EmailService {
    private resend: Resend;

    constructor(private configService: ConfigService) {
      this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY') );
    }

    async sendVerificationEmail(email:string, token:string) {
        const appUrl = this.configService.get<string>('APP_URL');
        const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

        await this.resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Verifica tu correo electrónico",
            html: `
               <h2>Bienvenido a nuestro sistema de autenticación</h2>
                <p>Gracias por registrarte. Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
                <a href="${verificationUrl}">Verificar correo electrónico</a>
            `,
        })
    
    }

    async sendPasswordResetEmail(email:string, token:string) {
        const appUrl = this.configService.get<string>('APP_URL');
        const resetUrl = `${appUrl}/api/auth/reset-password?token=${token}`;

        await this.resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Reestablece tu contraseña",
            html: `
               <h2>Reestablece tu contraseña</h2>
                <p>Gracias por registrarte. Por favor, haz clic en el siguiente enlace para reestablecer tu contraseña:</p>
                <a href="${resetUrl}">Reestablecer contraseña</a>
            `,
        })
    
    }
}