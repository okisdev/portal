import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return ctx.db.portal_user.findMany();
  }),

  getUserById: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.portal_user.findUnique({
      where: {
        id: input.id,
      },
    });
  }),

  getNotifications: protectedProcedure.query(({ ctx }) => {
    return ctx.db.portal_userNotifications.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  getUnreadNotificationsCount: protectedProcedure.query(({ ctx }) => {
    return ctx.db.portal_userNotifications.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });
  }),

  markNotificationAsRead: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return ctx.db.portal_userNotifications.update({
      where: {
        id: input,
        userId: ctx.session.user.id,
      },
      data: {
        read: true,
      },
    });
  }),

  markAllNotificationsAsRead: protectedProcedure.mutation(({ ctx }) => {
    return ctx.db.portal_userNotifications.updateMany({
      where: {
        userId: ctx.session.user.id,
      },
      data: {
        read: true,
      },
    });
  }),

  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
        metadata: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.portal_userNotifications.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        },
      });
    }),
});
