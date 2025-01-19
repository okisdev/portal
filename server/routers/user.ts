import { user } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(user);
  }),

  getUserById: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select()
      .from(user)
      .where(eq(user.id, input.id))
      .then((rows) => rows[0]);
  }),
});
