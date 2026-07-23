import { 
    Controller, 
    Post, 
    Body, 
    HttpCode, 
    HttpStatus, 
    Get,
    Query,
    Res,
    Req
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { User } from 'src/db/schema';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorators';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';



@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Get('verify-email')
    @ApiOperation({ summary: 'Verificar el correo por medio del token' })
    async verifyEmail(
        @Query('token') token: string,
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.verifyEmail(token, res);
    }
        
    //Con el http code OK, se hace que responda con un 200 y no con un 201 de creado porque no se esta creando un recurso, se esta validando algo
    //Y el passthrough: true permite que se pueda modificar la respuesta para el http code
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    async login(
        @Body() dto: LoginDto, 
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.login(dto, res);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refrescar token de sesión' })
    async refresh(
        @Req() req:Request,
        @Res({passthrough: true}) res: Response
    ) {
        const cookies = req.cookies as Record<string, string >;
        const refreshToken = cookies?.refresh_token;
        return this.authService.refresh(refreshToken, res);
    }

    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cerrar sesión e invalidar el token' })
    async logout(
        @CurrentUser() user: User,
        @Res({passthrough: true}) res: Response
    ) {
        return this.authService.logout(user.id, res);
    }

    @Get('me')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Obtener información del usuario actual' })
    me(@CurrentUser() user: User) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.role,
            isVerified: user.isVerified,
        }
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }


    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restablecer contraseña' })
    async resetPassword( @Body() dto: ResetPasswordDto ) {
        return this.authService.resetPassword(dto.token, dto.password);
    }
}