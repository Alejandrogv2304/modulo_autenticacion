import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTaskDto{
    @ApiProperty({example:'Tarea de ejemplo'})
    @IsString()
    @IsNotEmpty()
    tittle!: string;

    @ApiProperty({
        example:'Descripción de la tarea', 
        required:false
    })
    @IsString()
    @IsOptional()
    description?: string;
}