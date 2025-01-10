import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import z from 'zod';

export const authRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      const existingUser = await ctx.db.user.findUnique({ where: { email } });

      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists with this email' });
      }

      return ctx.db.user.create({ data: { email, password } });
    }),
});
