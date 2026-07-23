import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/db/schema";
import { UsersService } from "src/users/users.service";


@Injectable()
export class JwtAuthGuard implements CanActivate {

    constructor(
     private reflector: Reflector,
     private jwtService: JwtService,
     private configService: ConfigService,
     private usersService: UsersService,
    ){}

    //Este es un metodo que viene de NestJs por eso se implementa, es una interfaz que define el contrato que deben seguir los guards, para decidir si deja o no pasar a una ruta
    //Se revisa en los metadatos si se tiene el isPublic, si lo tiene no se pide token, sino lo tiene se exige el token, se verifica el token y el usuario, se guarda el usuario en la request y se da acceso a la ruta.
    async canActivate(context:ExecutionContext): Promise<boolean> {
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request & {user: User}>();
        const token = this.extractTokenFromHeader(request);

        if(!token){
            throw new UnauthorizedException('No se proporcionó un token de autenticación');
        }
        let payload : {sub: string, email: string, role: string};

        try{
            payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET')
            });
        }catch{
            throw new UnauthorizedException('Token inválido o expirado');
        }

        const user = await this.usersService.findById(payload.sub);

        if(!user){
            throw new UnauthorizedException('Usuario no encontrado');
        }

        request.user = user;
        return true;

    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = ((request.headers as unknown) as Record<string,string>)
        .authorization?.split(' ') ?? [];

        return type === 'Bearer' ? token : undefined;
    }
}