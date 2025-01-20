import { userTask } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export const taskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).default('todo'),
        priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
        dueDate: z.date().optional(),
        assignedTo: z.string().optional(),
        labels: z.array(z.string()).optional(),
        parentTaskId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const taskData = {
        id: crypto.randomUUID(),
        userId: ctx.session.user.id,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        assignedTo: input.assignedTo,
        labels: input.labels ? JSON.stringify(input.labels) : null,
        parentTaskId: input.parentTaskId,
      } as const;

      return ctx.db.insert(userTask).values(taskData);
    }),

  getAll: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).optional(),
          priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
          assignedToMe: z.boolean().optional(),
          parentTaskId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input?.status) {
        conditions.push(eq(userTask.status, input.status));
      }
      if (input?.priority) {
        conditions.push(eq(userTask.priority, input.priority));
      }
      if (input?.assignedToMe) {
        conditions.push(eq(userTask.assignedTo, ctx.session.user.id));
      } else {
        conditions.push(eq(userTask.userId, ctx.session.user.id));
      }
      if (input?.parentTaskId) {
        conditions.push(eq(userTask.parentTaskId, input.parentTaskId));
      }

      return ctx.db
        .select()
        .from(userTask)
        .where(and(...conditions))
        .orderBy(userTask.createdAt);
    }),

  // Get task by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db
      .select()
      .from(userTask)
      .where(and(eq(userTask.id, input.id), eq(userTask.userId, ctx.session.user.id)))
      .then((rows) => rows[0]);
  }),

  // Update task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).optional(),
          priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
          dueDate: z.date().optional(),
          completedAt: z.date().optional(),
          assignedTo: z.string().optional(),
          labels: z.array(z.string()).optional(),
          parentTaskId: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { labels, ...rest } = input.data;
      const updateData = {
        ...rest,
        labels: labels ? JSON.stringify(labels) : undefined,
      } as const;

      return ctx.db
        .update(userTask)
        .set(updateData)
        .where(and(eq(userTask.id, input.id), eq(userTask.userId, ctx.session.user.id)));
    }),

  // Delete task
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.delete(userTask).where(and(eq(userTask.id, input.id), eq(userTask.userId, ctx.session.user.id)));
  }),
});
