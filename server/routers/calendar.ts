import { calendarEvent, calendarFolder } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

export const calendarRouter = createTRPCRouter({
  getFolders: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(calendarFolder).where(eq(calendarFolder.userId, ctx.session.user.id));
  }),

  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        color: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color')
          .default('#4f46e5'),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(calendarFolder)
        .where(and(eq(calendarFolder.userId, ctx.session.user.id), eq(calendarFolder.name, input.name)))
        .then((rows) => rows[0]);

      if (existing) {
        return existing;
      }

      // Create new folder
      const [folder] = await ctx.db
        .insert(calendarFolder)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          color: input.color,
          isDefault: input.isDefault,
        })
        .returning();

      return folder;
    }),

  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(calendarEvent)
        .where(and(eq(calendarEvent.userId, ctx.session.user.id), gte(calendarEvent.startAt, input.startDate), lte(calendarEvent.endAt, input.endDate)));
    }),

  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date(),
        endAt: z.date(),
        isAllDay: z.boolean(),
        isPublic: z.boolean(),
        folderId: z.string(),
        recurrence: z.string().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(calendarEvent).values({
        userId: ctx.session.user.id,
        ...input,
      });
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date().optional(),
        endAt: z.date().optional(),
        isAllDay: z.boolean().optional(),
        isPublic: z.boolean().optional(),
        folderId: z.string().optional(),
        recurrence: z.string().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(calendarEvent)
        .set(updateData)
        .where(and(eq(calendarEvent.id, input.id), eq(calendarEvent.userId, ctx.session.user.id)));
    }),

  deleteEvent: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(calendarEvent).where(and(eq(calendarEvent.id, input), eq(calendarEvent.userId, ctx.session.user.id)));
  }),

  updateFolder: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(calendarFolder)
        .set({
          name: input.name,
          color: input.color,
        })
        .where(and(eq(calendarFolder.id, input.id), eq(calendarFolder.userId, ctx.session.user.id)));
    }),

  deleteFolder: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.db.delete(calendarFolder).where(and(eq(calendarFolder.id, input), eq(calendarFolder.userId, ctx.session.user.id)));
  }),
});
