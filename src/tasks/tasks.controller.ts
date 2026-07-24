import { Body, Controller, Get, Param, Post, Patch, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from 'src/db/schema';
import { TasksService } from './tasks.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('Tasks')
@Controller('tasks')
@ApiBearerAuth()
export class TasksController {
 constructor(private taskService: TasksService){}

 @Get()
 @ApiOperation({ summary: 'Obtener todas las tareas de un usuario'})
 findAll(@CurrentUser() user: User){
    return this.taskService.findAllForUser(user.id);
 }

 @Post()
 @ApiOperation({ summary: 'Crear una nueva tarea'})
 create(@CurrentUser() user: User, @Body() dto: CreateTaskDto){
    return this.taskService.createTask(user.id, dto);
 }

 @Patch(':id')
 @ApiOperation({ summary: 'Actualizar una tarea existente'})
 update(
    @CurrentUser() user: User, 
    @Param('id') id: string, 
    @Body() dto: Partial<CreateTaskDto>
){
    return this.taskService.updateTask(id,user.id, dto);
 }


 @Delete(':id')
 @ApiOperation({ summary: 'Eliminar una tarea existente'})
 delete(
    @CurrentUser() user: User, 
    @Param('id') id: string
){
    return this.taskService.deleteTask(id, user.id);
 }

}

   

