import { subscriptionCoupon, subscriptionPlan } from '@/drizzle/schema';
import { stripe } from '@/lib/payment';
import { generateCouponCode } from '@/lib/utils';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const payRouter = createTRPCRouter({
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

  deleteStripeSubscriptionPlan: protectedProcedure.input(z.object({ productId: z.string() })).mutation(async ({ ctx, input }) => {
    return await stripe.products.del(input.productId);
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

  fetchLocalSubscriptionPlans: protectedProcedure.query(async ({ ctx }) => {
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
        source: z.string().optional(),
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
            source: input.source,
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create coupon' });
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create subscription plan' });
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update subscription plan' });
      }
    }),

  syncStripeSubscriptionPlans: protectedProcedure.mutation(async ({ ctx }) => {
    const products = await stripe.products.list({ active: true });
    const prices = await stripe.prices.list({ active: true });

    const productwithPrices = products.data
      .map((product) => {
        const price = prices.data.filter((p) => p.product === product.id && p.type === 'recurring').sort((a, b) => b.created - a.created)[0];

        return {
          product,
          price,
        };
      })
      .filter((item) => item.price);

    const localPlans = await ctx.db.select().from(subscriptionPlan);

    for (const item of productwithPrices) {
      const { product, price } = item;
      if (!price.recurring?.interval) continue;

      const interval = price.recurring.interval;
      if (interval !== 'month' && interval !== 'year') continue;

      const existingPlan = localPlans.find((plan) => plan.stripePriceId === price.id);

      const planData = {
        name: product.name,
        description: product.description ?? '',
        price: price.unit_amount ?? 0,
        interval: interval,
        currency: price.currency,
        stripePriceId: price.id,
        stripeProductId: product.id,
        active: product.active,
        features: '',
      };

      if (existingPlan) {
        await ctx.db.update(subscriptionPlan).set(planData).where(eq(subscriptionPlan.id, existingPlan.id));
      } else {
        await ctx.db.insert(subscriptionPlan).values(planData);
      }
    }

    const updatedLocalPlans = await ctx.db.select().from(subscriptionPlan).orderBy(asc(subscriptionPlan.price));

    return {
      stripeProducts: productwithPrices,
      localPlans: updatedLocalPlans,
    };
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create price' });
      }
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete coupon' });
      }
    }),
});
