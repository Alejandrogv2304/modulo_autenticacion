import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from 'src/users/users.service';
import { EmailService } from './email.service';
import type { RegisterDto} from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { Response } from 'express';
import type { User } from 'src/db/schema';


@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async register(dto: RegisterDto) {

         const existingUser = await this.usersService.findByEmail(dto.email);

         if(existingUser) {
            throw new ConflictException('El correo electrónico ya está en uso');
         }

         //El 12 es el número de rondas o de iteraciones que aplicara el algoritmo que usa bcrypt, usando mezclas, estructuras del algoritmo y el hash y salt.
         const passwordHash = await bcrypt.hash(dto.password, 12);

         //Armamos el token de verificacion usando una clave de 32 bytes hexadecimales
         const verificationToken = crypto.randomBytes(32).toString('hex');
         const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

         const user = await this.usersService.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
            verificationToken,
            verificationTokenExpiresAt,
         });

         void this.emailService.sendVerificationEmail(user.email, verificationToken);

         return {
            message: 'Usuario registrado exitosamente. Por favor, revisa tu correo electrónico para verificar tu cuenta.',
         }
    }

    async login(dto:LoginDto, res: Response) {
        const user = await this.usersService.findByEmail(dto.email);

        if(!user){
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        
        if(!passwordMatch){
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if(!user.isVerified){
            throw new UnauthorizedException('Por favor, verifica tu correo electrónico antes de iniciar sesión');
        }

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
            user:{
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
            }
        }
    }
}
