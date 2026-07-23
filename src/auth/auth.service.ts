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
            }
        }
    }

    //Este metodo se encarga de generar un nuevo access token a partir del refresh token, verificando que este sea válido de acuerdo al hash guardado en BD
    async refresh(refreshToken: string, res: Response) {
        if(!refreshToken){
            throw new UnauthorizedException('No se proporcionó un token de actualización');
        }

        let payload: {sub:string, email:string}
        try{
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),

            })
        } catch{
            throw new UnauthorizedException('Token de actualización inválido o expirado');
        }

        const user = await this.usersService.findById(payload.sub);

        if(!user || !user.refreshTokenHash){
            throw new UnauthorizedException('Usuario no encontrado o sin token de actualización');
        }

        const tokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if(!tokenMatch){
            throw new UnauthorizedException('Token de actualización inválido');
        }
        
        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken); 

        return{
            accessToken: tokens.accessToken,
        };
    }

    
    //Metodo para cerrar sesion, eliminando el hash del refresh token de DB para que no se puedan generar mas refresh tokens y borrando la cookie.
     async logout(userId:string, res: Response){
        await this.usersService.update(userId, { refreshTokenHash: null });
        res.clearCookie('refreshToken')
        return {
            message:'Sesión cerrada correctamente'
        }
    }

    async forgotPassword(email:string){
        const user = await this.usersService.findByEmail(email);

        if(!user){
            return{
                message: 
                'Si el correo electrónico está registrado, se enviará un enlace de restablecimiento de contraseña'
            }
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await this.usersService.update(user.id, {
            resetToken,
            resetTokenExpiresAt,
        });

        void this.emailService.sendPasswordResetEmail(user.email, resetToken);
        
        return{
            message: 
            'Si el correo electrónico está registrado, se enviará un enlace de restablecimiento de contraseña'
        }
    }

    async resetPassword(token:string, newPassword:string){
        const user = await this.usersService.findByResetToken(token);
        
        if(!user || !user.resetToken){
            throw new BadRequestException('Token de restablecimiento de contraseña inválido');
        }

        if(
            user.resetTokenExpiresAt && 
            user.resetTokenExpiresAt < new Date()
        ){
            throw new BadRequestException('El token de restablecimiento de contraseña ha expirado. Solicite uno nuevo');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await this.usersService.update(user.id, {
            passwordHash,
            resetToken: null,
            resetTokenExpiresAt: null,
        })

        return{
            message: 'Contraseña restablecida exitosamente. Ahora puede iniciar sesión',
        }
    }

    async verifyEmail(token: string, res: Response) {
        const user = await this.usersService.findByVerificationToken(token);

        if(!user || !user.verificationToken){
            throw new BadRequestException('Token de verificación inválido');
        }

        //Aquí la condición es que si existe la fecha de expiracion y es anterior a la fecha actual, se lanza el error
        if(
            user.verificationTokenExpiresAt && 
            user.verificationTokenExpiresAt < new Date()
        ){  
            throw new BadRequestException('El token de verificación ha expirado. Solicite uno nuevo');
        }

        //Ya se verifico el usuario, entonces cambiamos el estado y ponemos nulo los campos que apoyaban este proceso
        await this.usersService.update(user.id,{
            isVerified: true,
            verificationToken: null,
            verificationTokenExpiresAt: null,
        });

        //Hacemos lo mismo que cuando se logea el usuario
        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            message: 'Correo electrónico verificado exitosamente',
            accessToken: tokens.accessToken,
            user:{
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        }

    }


    //Este metodo se va a encargar de generar los tokens haciendo uso de la libreria jwtService, que es un servicio de NestJS que nos permite generar y verificar tokens JWT.
    //Son dos tokens, el de acceso de duración corta y el refresh que dura más tiempo y se almacena en la cookie
    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload,{
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        });

        const refreshToken = await this.jwtService.signAsync(payload,{
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });

        return { 
            accessToken, 
            refreshToken 
        };
    }

    //Con este metodo generamos el hash del refresh token y lo guardamos en la base de datos, para luego poder compararlo cuando el usuario haga una solicitud de refresh token.
    private async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash });
    }

    //Con este metodo establecemos la cookie del refresh token.
    private setRefreshTokenCookie(res: Response, refreshToken: string) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        })
    }
}
