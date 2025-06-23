import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { user, userNotifications } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(user);
  }),

  getUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(user)
        .where(eq(user.id, input.id))
        .then((rows) => rows[0]);
    }),

  getNotifications: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, ctx.session.user.id))
      .orderBy(desc(userNotifications.createdAt));
  }),

  getUnreadNotificationsCount: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({ count: count() })
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.userId, ctx.session.user.id),
          eq(userNotifications.read, false)
        )
      )
      .then((rows) => rows[0]);
  }),

  markNotificationAsRead: protectedProcedure
    .input(z.number())
    .mutation(({ ctx, input }) => {
      return ctx.db
        .update(userNotifications)
        .set({ read: true })
        .where(
          and(
            eq(userNotifications.userId, ctx.session.user.id),
            eq(userNotifications.id, input)
          )
        );
    }),

  markAllNotificationsAsRead: protectedProcedure.mutation(({ ctx }) => {
    return ctx.db
      .update(userNotifications)
      .set({ read: true })
      .where(eq(userNotifications.userId, ctx.session.user.id));
  }),

  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum(['MESSAGE']),
        subType: z.enum([
          'MENTIONED',
          'NOTE_ADDED',
          'NOTE_UPDATED',
          'NOTE_DELETED',
        ]),
        initiatorId: z.string().optional(),
        initiatorType: z.enum(['user', 'contact', 'team', 'system']),
        message: z.string(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(userNotifications).values({
        userId: input.userId,
        type: input.type,
        subType: input.subType,
        initiatorId: input.initiatorId,
        initiatorType: input.initiatorType,
        message: input.message,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
    }),
});
