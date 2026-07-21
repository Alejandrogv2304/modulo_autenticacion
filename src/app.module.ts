import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      //Esto nos permite que la configuracion y variables de entorno sean globales y no tener que hacer esto en cada modulo
      isGlobal: true,
      //Nos permite interpolar variables de entorno
      expandVariables: true,
    }),
    UsersModule,
  ],

})
export class AppModule {}
