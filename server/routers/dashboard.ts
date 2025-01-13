import { contact, contactActivity } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { desc, eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { z } from 'zod';

export const dashboardRouter = createTRPCRouter({
  getContacts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(contact).orderBy(desc(contact.createdAt));
  }),

  getContactById: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select()
      .from(contact)
      .where(eq(contact.id, input.id))
      .then((rows) => rows[0]);
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

  getContactActivities: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.select().from(contactActivity).where(eq(contactActivity.contactId, input.id));
  }),

  addContactActivity: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        type: z.string(),
        title: z.string(),
        description: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(contactActivity).values({
        contactId: input.contactId,
        userId: ctx.session?.user.id,
        type: input.type,
        title: input.title,
        description: input.description,
      });
    }),

  getContactPayments: protectedProcedure
    .input(
      z.object({
        email: z.string(),
      })
    )
    .query(async ({ input }) => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const stripe = new Stripe(process.env.STRIPE_KEY!, {
        apiVersion: '2024-12-18.acacia',
      });

      try {
        const payments = await stripe.paymentIntents.list({
          // email: input.email,
        });

        const filteredPayments = payments.data.filter((payment) => payment.receipt_email === input.email);

        return filteredPayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount / 100,
          status: payment.status,
          created: payment.created,
          currency: payment.currency,
        }));
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    }),
});
