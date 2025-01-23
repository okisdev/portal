import { subscriptionCoupon, subscriptionPlan } from '@/drizzle/schema';
import { stripe } from '@/lib/payment';
import { generateCouponCode } from '@/lib/utils';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const payRouter = createTRPCRouter({
  getPaymentsFromStripe: protectedProcedure.query(async ({ ctx }) => {
    const payments = await stripe.paymentIntents.list();
    return payments.data;
  }),

  getPaymentByContactEmail: protectedProcedure
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

  getContactStripeCustomerInfo: protectedProcedure.input(z.object({ email: z.string().optional(), phone: z.string().optional() })).query(async ({ input }) => {
    const allCustomers = await stripe.customers.list();
    const customer = allCustomers.data.find((customer) => customer.email === input.email || customer.phone === input.phone);

    if (!customer) {
      return null;
    }

    // Get all payments and subscriptions for this customer
    const [payments, subscriptions] = await Promise.all([
      stripe.paymentIntents.list({
        customer: customer.id,
        limit: 100,
      }),
      stripe.subscriptions.list({
        customer: customer.id,
        limit: 100,
      }),
    ]);

    const activeSubscriptions = subscriptions.data.filter((sub) => sub.status === 'active' || sub.status === 'trialing');

    // Get subscription payment intents to exclude them from one-time payments
    const subscriptionPaymentIntents = new Set(
      (
        await Promise.all(
          subscriptions.data.map((sub) =>
            stripe.paymentIntents
              .list({
                customer: customer.id,
                limit: 100,
              })
              .then((result) => result.data.filter((payment) => typeof payment.invoice === 'string' && payment.invoice.startsWith('in_')).map((payment) => payment.id))
          )
        )
      ).flat()
    );

    // Filter successful payments and separate one-time from subscription payments
    const successfulPayments = payments.data.filter((payment) => payment.status === 'succeeded' && !subscriptionPaymentIntents.has(payment.id));

    // Calculate payment statistics by type and currency
    const paymentStats = {
      oneTime: successfulPayments.reduce((acc, payment) => {
        const { currency } = payment;
        if (!acc[currency]) {
          acc[currency] = { total: 0, count: 0 };
        }
        acc[currency].total += payment.amount / 100;
        acc[currency].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>),

      subscription: subscriptions.data.reduce((acc, sub) => {
        const currency = sub.currency;
        if (!acc[currency]) {
          acc[currency] = {
            total: 0,
            count: 0,
            recurring: 0,
            activeCount: 0,
          };
        }
        acc[currency].count += 1;
        if (sub.status === 'active' || sub.status === 'trialing') {
          acc[currency].activeCount += 1;
          acc[currency].recurring += (sub.items.data[0]?.price.unit_amount || 0) / 100;
        }
        // Calculate total based on all successful payments for this subscription
        const totalPaid = sub.items.data[0]?.price.unit_amount
          ? ((sub.items.data[0].price.unit_amount || 0) *
              Math.floor(
                (Date.now() / 1000 - sub.created) /
                  (sub.items.data[0].price.recurring?.interval_count || 1) /
                  (sub.items.data[0].price.recurring?.interval === 'month' ? 30 * 24 * 60 * 60 : sub.items.data[0].price.recurring?.interval === 'year' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60)
              )) /
            100
          : 0;
        acc[currency].total += totalPaid;
        return acc;
      }, {} as Record<string, { total: number; count: number; recurring: number; activeCount: number }>),

      totalStats: {
        oneTimeCount: successfulPayments.length,
        subscriptionCount: subscriptions.data.length,
        activeSubscriptionCount: activeSubscriptions.length,
        lastPaymentDate: successfulPayments.length > 0 ? successfulPayments[0].created : null,
        lastSubscriptionDate: activeSubscriptions.length > 0 ? activeSubscriptions[0].created : null,
      },
    };

    // Get recent payments (including both one-time and subscription payments)
    const recentPayments = successfulPayments.slice(0, 10).map((payment) => ({
      id: payment.id,
      amount: payment.amount / 100,
      status: payment.status,
      created: payment.created,
      currency: payment.currency,
      description: payment.description,
      receipt_email: payment.receipt_email,
      type: 'one-time',
    }));

    // Add subscription payments to the list
    const subscriptionPayments = activeSubscriptions.map((sub) => ({
      id: sub.id,
      amount: (sub.items.data[0]?.price.unit_amount || 0) / 100,
      status: sub.status,
      created: sub.created,
      currency: sub.currency,
      description: `${sub.items.data[0]?.price.nickname || 'Subscription'} (${sub.items.data[0]?.price.recurring?.interval || 'monthly'})`,
      type: 'subscription' as const,
      interval: sub.items.data[0]?.price.recurring?.interval,
      currentPeriodEnd: sub.current_period_end,
      totalPaid: (Math.floor((Date.now() / 1000 - sub.created) / (30 * 24 * 60 * 60)) * (sub.items.data[0]?.price.unit_amount || 0)) / 100,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      cancelAt: sub.cancel_at,
    }));

    // Combine and sort all payments by date
    const allRecentPayments = [...recentPayments, ...subscriptionPayments].sort((a, b) => b.created - a.created).slice(0, 10);

    // Map all subscriptions, including cancelled and expired ones
    const allSubscriptionPayments = subscriptions.data.map((sub) => ({
      id: sub.id,
      amount: (sub.items.data[0]?.price.unit_amount || 0) / 100,
      status: sub.status,
      created: sub.created,
      currency: sub.currency,
      description: `${sub.items.data[0]?.price.nickname || 'Subscription'} (${sub.items.data[0]?.price.recurring?.interval || 'monthly'})`,
      type: 'subscription' as const,
      interval: sub.items.data[0]?.price.recurring?.interval,
      currentPeriodEnd: sub.current_period_end,
      totalPaid: (Math.floor((Date.now() / 1000 - sub.created) / (30 * 24 * 60 * 60)) * (sub.items.data[0]?.price.unit_amount || 0)) / 100,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      cancelAt: sub.cancel_at,
      endedAt: sub.ended_at,
      canceledAt: sub.canceled_at,
    }));

    return {
      customer,
      stats: paymentStats,
      recentPayments: allRecentPayments,
      subscriptions,
      activeSubscriptions: subscriptionPayments,
      allSubscriptions: allSubscriptionPayments,
      allPayments: payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount / 100,
        status: payment.status,
        created: payment.created,
        currency: payment.currency,
        type: 'one-time' as const,
      })),
    };
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
