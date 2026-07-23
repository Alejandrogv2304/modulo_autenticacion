import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TasksModule } from './tasks/tasks.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      //Esto nos permite que la configuracion y variables de entorno sean globales y no tener que hacer esto en cada modulo
      isGlobal: true,
      //Nos permite interpolar variables de entorno
      expandVariables: true,
    }),
    JwtModule.register({global: true}),
    UsersModule,
    AuthModule,
    TasksModule,
    AdminModule,
  ],
providers: [
  { provide: 'APP_GUARD', useClass: JwtAuthGuard },
  { provide: 'APP_GUARD', useClass: RolesGuard },
],
})
export class AppModule {}
