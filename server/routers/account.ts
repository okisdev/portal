import { notifications, user } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { encryptPassword } from '@/utils/password';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import z from 'zod';

export const accountRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;

    // if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

    // return ctx.db
    //   .select()
    //   .from(user)
    //   .where(eq(user.id, ctx.session.user.id))
    //   .then(([user]) => user);
  }),

  getMeFromDatabase: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        username: user.username,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .then(([user]) => user);
  }),

  updateMe: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      return ctx.db
        .update(user)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          image: input.image,
        })
        .where(eq(user.id, ctx.session.user.id));
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const hashedPassword = encryptPassword(input.newPassword);

      return ctx.db.update(user).set({ password: hashedPassword }).where(eq(user.id, ctx.session.user.id));
    }),

  getNotifications: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(notifications).where(eq(notifications.userId, ctx.session.user.id)).orderBy(desc(notifications.createdAt));
  }),

  markNotificationAsRead: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return ctx.db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, ctx.session.user.id), eq(notifications.id, input)));
  }),

  markAllNotificationsAsRead: protectedProcedure.mutation(({ ctx }) => {
    return ctx.db.update(notifications).set({ read: true }).where(eq(notifications.userId, ctx.session.user.id));
  }),
});
