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
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string(),
        phone: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.email, input.email))
        .then((rows) => rows[0]);

      if (existingContact) {
        return existingContact;
      }

      const result = await ctx.db
        .insert(contact)
        .values({
          firstName: input.firstName ?? '',
          lastName: input.lastName ?? '',
          email: input.email,
          phone: input.phone ?? '',
          company: input.company ?? '',
        })
        .returning();

      return result[0];
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
          currency: price?.currency || 'usd',
        },
        priceId: price?.id,
      };
    });
  }),

  fetchStripeSubscriptionPlanByCouponCode: protectedProcedure.input(z.object({ code: z.string() })).query(async ({ ctx, input }) => {
    const coupon = await ctx.db
      .select()
      .from(subscriptionCoupon)
      .where(eq(subscriptionCoupon.code, input.code))
      .then((rows) => rows[0]);

    if (!coupon) {
      return null;
    }

    const product = await stripe.products.retrieve(coupon.planId);
    const prices = await stripe.prices.list({
      product: coupon.planId,
      active: true,
      limit: 1,
    });

    return {
      ...product,
      price: prices.data[0],
      discountPercent: coupon.discountPercent,
    };
  }),

  fetchSubscriptionPlans: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(subscriptionPlan).orderBy(asc(subscriptionPlan.price));
  }),

  fetchSubscriptionCouponByCode: protectedProcedure.input(z.object({ code: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select()
      .from(subscriptionCoupon)
      .where(eq(subscriptionCoupon.code, input.code))
      .then((rows) => rows[0]);
  }),

  fetchSubscriptionCoupons: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(subscriptionCoupon).orderBy(asc(subscriptionCoupon.discountPercent));
  }),

  createSubscriptionCoupon: protectedProcedure
    .input(
      z.object({
        discountPercent: z.number().min(0).max(100),
        maxUses: z.number().optional(),
        expiresAt: z.date().optional(),
        planId: z.string(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const couponCode = generateCouponCode();

      try {
        if (input.discountPercent === 100) {
          return await ctx.db.insert(subscriptionCoupon).values({
            code: couponCode,
            discountPercent: 0,
            maxUses: input.maxUses,
            expiresAt: input.expiresAt,
            planId: input.planId,
            createdBy: ctx.session?.user.id,
            company: input.company,
          });
        }

        const stripeCoupon = await stripe.coupons.create({
          metadata: {
            planId: input.planId,
            company: input.company ?? '',
          },
          id: couponCode,
          max_redemptions: input.maxUses,
          percent_off: 100 - input.discountPercent,
          duration: 'repeating',
          duration_in_months: 1,
        });

        return await ctx.db.insert(subscriptionCoupon).values({
          code: couponCode,
          discountPercent: (100 - input.discountPercent) / 100,
          maxUses: input.maxUses,
          expiresAt: input.expiresAt,
          planId: input.planId,
          createdBy: ctx.session?.user.id,
          company: input.company,
          stripeId: stripeCoupon.id,
        });
      } catch (error) {
        console.error('Error creating Stripe coupon:', error);
        throw new Error('Failed to create coupon');
      }
    }),

  createStripePlan: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        interval: z.enum(['month', 'year']),
        currency: z.enum(['usd', 'eur', 'gbp', 'hkd']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const product = await stripe.products.create({
          name: input.name,
          description: input.description,
          active: true,
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: input.price,
          currency: input.currency,
          recurring: {
            interval: input.interval,
          },
        });

        return { product, price };
      } catch (error) {
        throw new Error('Failed to create subscription plan');
      }
    }),

  updateStripePlan: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        active: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const product = await stripe.products.update(input.productId, {
          name: input.name,
          description: input.description,
          active: input.active,
        });

        return product;
      } catch (error) {
        throw new Error('Failed to update subscription plan');
      }
    }),

  createStripePlanPrice: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        price: z.number(),
        interval: z.enum(['month', 'year']),
        currency: z.enum(['usd', 'eur', 'gbp', 'hkd']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const price = await stripe.prices.create({
          product: input.productId,
          unit_amount: input.price,
          currency: input.currency,
          recurring: {
            interval: input.interval,
          },
        });

        return price;
      } catch (error) {
        throw new Error('Failed to create price');
      }
    }),

  fetchStripePlanByCouponCode: protectedProcedure.input(z.object({ code: z.string() })).query(async ({ ctx, input }) => {
    const coupon = await ctx.db
      .select()
      .from(subscriptionCoupon)
      .where(eq(subscriptionCoupon.code, input.code))
      .then((rows) => rows[0]);

    return await stripe.prices.retrieve(coupon.planId);
  }),

  deleteSubscriptionCoupon: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stripeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.stripeId) {
          await stripe.coupons.del(input.stripeId);
        }

        return await ctx.db.delete(subscriptionCoupon).where(eq(subscriptionCoupon.id, input.id));
      } catch (error) {
        console.error('Error deleting coupon:', error);
        throw new Error('Failed to delete coupon');
      }
    }),
});
