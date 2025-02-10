import { User } from '@/database/models/user';
import { UserNotifications } from '@/database/models/userNotifications';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return User.find();
  }),

  getUserById: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return User.findById(input.id);
  }),

  getNotifications: protectedProcedure.query(({ ctx }) => {
    return UserNotifications.find({ userId: ctx.session.user.id }).sort({ createdAt: -1 });
  }),

  getUnreadNotificationsCount: protectedProcedure.query(({ ctx }) => {
    return UserNotifications.countDocuments({ userId: ctx.session.user.id, read: false });
  }),

  markNotificationAsRead: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return UserNotifications.updateOne({ userId: ctx.session.user.id, id: input }, { read: true });
  }),

  markAllNotificationsAsRead: protectedProcedure.mutation(({ ctx }) => {
    return UserNotifications.updateMany({ userId: ctx.session.user.id }, { read: true });
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
      return UserNotifications.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
    }),
});
