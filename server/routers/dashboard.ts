import { contact } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const dashboardRouter = createTRPCRouter({
  getContacts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(contact).orderBy(desc(contact.createdAt));
  }),

  getContact: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const rows = await ctx.db.select().from(contact).where(eq(contact.id, input.id)).limit(1);

    return rows[0];
  }),

  addContact: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        phone: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(contact).values({
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
      });
    }),
});
