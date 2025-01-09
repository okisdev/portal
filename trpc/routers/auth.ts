import { createTRPCRouter, protectedProcedure } from '../trpc';

export const authRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  getMyConnects: protectedProcedure.query(({ ctx }) => {
    return ctx.db.account.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),
});
