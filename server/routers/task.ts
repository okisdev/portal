import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
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

      return ctx.db.portal_userTask.create({
        data: taskData,
      });
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
      const where = {
        AND: [
          input?.status ? { status: input.status } : {},
          input?.priority ? { priority: input.priority } : {},
          input?.assignedToMe ? { assignedTo: ctx.session.user.id } : { userId: ctx.session.user.id },
          input?.parentTaskId ? { parentTaskId: input.parentTaskId } : {},
        ],
      };

      return ctx.db.portal_userTask.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.portal_userTask.findFirst({
      where: {
        id: input.id,
        userId: ctx.session.user.id,
      },
    });
  }),

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

      return ctx.db.portal_userTask.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: updateData,
      });
    }),

  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.portal_userTask.delete({
      where: {
        id: input.id,
        userId: ctx.session.user.id,
      },
    });
  }),
});
