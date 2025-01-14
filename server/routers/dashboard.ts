import { contact, contactActivity } from '@/drizzle/schema';
import { stripe } from '@/lib/payment';
import { prioritySchema, statusSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { desc, eq } from 'drizzle-orm';
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
    return ctx.db.select().from(contactActivity).where(eq(contactActivity.contactId, input.id)).orderBy(desc(contactActivity.createdAt));
  }),

  addContactActivity: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        type: z.string(),
        title: z.string(),
        description: z.string(),
        initiatorType: z.enum(['user', 'contact', 'system']),
        initiatorId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(contactActivity).values({
        contactId: input.contactId,
        userId: ctx.session?.user.id,
        type: input.type,
        initiatorType: input.initiatorType,
        initiatorId: input.initiatorId,
        title: input.title,
        description: input.description,
      });
    }),

  deleteContactActivity: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.delete(contactActivity).where(eq(contactActivity.id, input.id));
  }),

  getContactPayments: protectedProcedure
    .input(
      z.object({
        email: z.string(),
      })
    )
    .query(async ({ input }) => {
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

  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        priority: prioritySchema.optional(),
        workExperience: z.string().optional(),
        currentRole: z.string().optional(),
        industry: z.string().optional(),
        skills: z.string().optional(),
        status: statusSchema.optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db.update(contact).set(updateData).where(eq(contact.id, id));
    }),
});
