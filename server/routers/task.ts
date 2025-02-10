import { UserTask } from '@/database/models/userTask';
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

      return UserTask.create(taskData);
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
        conditions.push({ status: input.status });
      }
      if (input?.priority) {
        conditions.push({ priority: input.priority });
      }
      if (input?.assignedToMe) {
        conditions.push({ assignedTo: ctx.session.user.id });
      } else {
        conditions.push({ userId: ctx.session.user.id });
      }
      if (input?.parentTaskId) {
        conditions.push({ parentTaskId: input.parentTaskId });
      }

      return UserTask.find({ ...conditions }).sort({ createdAt: -1 });
    }),

  // Get task by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return UserTask.findOne({ id: input.id, userId: ctx.session.user.id });
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

      return UserTask.updateOne({ id: input.id, userId: ctx.session.user.id }, updateData);
    }),

  // Delete task
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return UserTask.deleteOne({ id: input.id, userId: ctx.session.user.id });
  }),
});
