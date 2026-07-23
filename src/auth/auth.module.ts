import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "src/users/users.module";
import { EmailService } from "./email.service";


@Module({
    imports: [
        UsersModule,
        JwtModule.register({})
    ],
    controllers: [AuthController],
    providers: [AuthService, EmailService],
})
export class AuthModule{}