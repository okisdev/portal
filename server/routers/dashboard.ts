import { client } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const dashboardRouter = createTRPCRouter({
  getClients: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(client).orderBy(desc(client.createdAt));
  }),

  getClient: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.select().from(client).where(eq(client.id, input));
  }),
});
