import { user } from '@/drizzle/schema';
import { generateUUID } from '@/lib/utils';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
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

      const existingUser = await ctx.db.select().from(user).where(eq(user.email, email));

      if (existingUser.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists with this email' });
      }

      return ctx.db.insert(user).values({
        id: generateUUID(),
        email,
        password,
      });
    }),
});
