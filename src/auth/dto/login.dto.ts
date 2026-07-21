import { IsEmail, IsNotEmpty, IsString, MinLength, minLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {

    @ApiProperty({example:'correo123@correo.com'})
    @IsEmail({}, {message:'El correo debe ser un correo valido'})
    @IsNotEmpty({message:'El correo es obligatorio'})
    email!: string;

    @ApiProperty({example:'password1234' })
    @IsString()
    @IsNotEmpty({message:'La contraseña es obligatoria'}) 
    password!: string;

}
