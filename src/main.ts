import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(cookieParser());

  //Con esto ponemos un prefijo global a todas las rutas de la API
  app.setGlobalPrefix('api');

  //Este pipeline nos ayudan a validar todas las entradas de datos de las peticiones, 
  // valida las entradas, rechaza las extras y transforma los datos a los tipos que necesitamos
  //No permite propiedades no declaradas en el DTO y lanza error si vienen propiedades extras
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  //Aquí usamos el filtro de excepciones HTTP que tenemos en common
  app.useGlobalFilters(new HttpExceptionFilter());


  const config = new DocumentBuilder()
    .setTitle('Modulo de Autenticacion con NestJs')
    .setDescription('Sistema completo de autenticación para sistemas NestJS')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);


  const port = configService.get<number>('PORT') || 3000;

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Aplicación corriendo en http://localhost:${port}/api`);
  console.log(`Documentación de la API disponible en http://localhost:${port}/api/docs`);
}
bootstrap();
