import { contact, contactActivity, subscriptionCoupon, subscriptionPlan } from '@/drizzle/schema';
import { stripe } from '@/lib/payment';
import { prioritySchema, statusSchema } from '@/lib/schema';
import { generateCouponCode } from '@/lib/utils';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { asc, desc, eq } from 'drizzle-orm';
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

  fetchStripeSubscriptionPlans: protectedProcedure.query(async ({ ctx }) => {
    const products = await stripe.products.list({ active: true });
    const prices = await stripe.prices.list({ active: true });

    return products.data.map((product) => {
      const price = prices.data.find((p) => p.product === product.id && p.type === 'recurring');

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        metadata: {
          price: price?.unit_amount || 0,
          interval: price?.recurring?.interval || 'month',
        },
        priceId: price?.id,
      };
    });
  }),

  fetchSubscriptionPlans: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(subscriptionPlan).orderBy(asc(subscriptionPlan.price));
  }),

  fetchSubscriptionCoupons: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(subscriptionCoupon).orderBy(asc(subscriptionCoupon.discountPercent));
  }),

  createSubscriptionCoupon: protectedProcedure
    .input(
      z.object({
        discountPercent: z.number().min(0.01).max(1.0),
        maxUses: z.number().optional(),
        expiresAt: z.date().optional(),
        planId: z.string(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(subscriptionCoupon).values({
        code: generateCouponCode(),
        discountPercent: input.discountPercent,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
        planId: input.planId,
        createdBy: ctx.session?.user.id,
        company: input.company,
      });
    }),
});
