import { user } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { encryptPassword } from '@/utils/password';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
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
      .select()
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
});
