import { generateUUID } from '@/lib/utils';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import z from 'zod';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      const existingUser = await ctx.db.portal_user.findFirst({
        where: {
          email,
        },
      });

      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists with this email' });
      }

      return ctx.db.portal_user.create({
        data: {
          id: generateUUID(),
          email,
          password,
        },
      });
    }),
});
