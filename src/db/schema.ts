import{
pgTable,
text,
timestamp,
uuid,
pgEnum,
boolean
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    isVerified: boolean('is_verified').default(false).notNull(),
    verificationToken: text('verification_token'),
    verificationTokenExpiresAt: timestamp('verification_token_expires_at'),
    resetToken: text('reset_token'),
    resetTokenExpiresAt: timestamp('reset_token_expires_at'),
    refreshTokenHash: text('refresh_token_hash'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const taskStatusEnum = pgEnum('task_status', 
    [
        'to do', 
        'in_progress', 
        'done'
    ]);

export const tasks = pgTable('tasks', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    status: taskStatusEnum('status').notNull().default('to do'),
    //Esta es una referencia a la tabla de usuarios, se especifica que si se borra el usuario id se borre la tarea en cascada.
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferSelect;