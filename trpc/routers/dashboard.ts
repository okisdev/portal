import { createTRPCRouter, protectedProcedure } from '../trpc';

export const dashboardRouter = createTRPCRouter({
  getClients: protectedProcedure.query(({ ctx }) => {
    return ctx.db.client.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),
});
