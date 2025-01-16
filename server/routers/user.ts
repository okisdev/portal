import { user } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(user);
  }),
});
