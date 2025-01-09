import { createTRPCRouter, protectedProcedure } from '../trpc';

export const authRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),
});
