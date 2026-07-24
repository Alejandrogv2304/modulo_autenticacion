import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { db } from 'src/db';
import { tasks } from 'src/db/schema';
import { eq , and } from 'drizzle-orm';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {

    async findAllForUser(userId: string) {
        return db.query.tasks.findMany({
            where: eq(tasks.userId, userId)
        });
    }

    async createTask(userId: string, dto: CreateTaskDto){
        const [task] = await db
        .insert(tasks)
        .values({...dto, userId})
        .returning();

        return task;
    }

    async updateTask(id:string, userId:string, data: Partial <CreateTaskDto> ){
        const  task  = await db.query.tasks.findFirst({
            where: eq(tasks.id, id),
        });

        if(!task){
            throw new NotFoundException('Tarea no encontrada');
        }
        if(task.userId !== userId){
            throw new ForbiddenException('No tienes permisos para actualizar esta tarea');
        }
        const [updated] = await db
            .update(tasks)
            .set({...data, updatedAt: new Date()})
            .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
            .returning();

        return updated;
    }

    async deleteTask(id:string, userId:string){
        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, id),
        });
        
        if(!task){
            throw new NotFoundException('Tarea no encontrada');
        }
        if(task.userId !== userId){
            throw new ForbiddenException('No tienes permisos para actualizar esta tarea');
        }
        await db.delete(tasks).where(eq(tasks.id, id));

        return { message: 'Tarea eliminada exitosamente' };
    }
}
