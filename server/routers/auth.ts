import { User } from '@/database/models/user';
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

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists with this email' });
      }

      return User.create({
        id: generateUUID(),
        email,
        password,
      });
    }),
});
