import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const dashboardRouter = createTRPCRouter({
  getClients: protectedProcedure.query(({ ctx }) => {
    return ctx.db.client.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  getClient: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.client.findUnique({
      where: { id: input },
    });
  }),
});
