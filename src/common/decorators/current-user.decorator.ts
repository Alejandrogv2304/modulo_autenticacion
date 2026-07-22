import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from 'src/db/schema';
import { Request } from 'express';

type RequestWithUser = Request & { user: User };

//Aquí lo que estamos haciendo es un decorador personalizado que nos permita sacar de la peticion HTTP, o sea el request
//el user, para luego usarlo en los controladores, el switchToHttp() nos indica que se trabaja con HTTP, luego obtiene la request
// y de ahí se saca el user
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestWithUser>();
        return request.user;
    }
)