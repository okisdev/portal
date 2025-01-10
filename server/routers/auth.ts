import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const authRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),
});
