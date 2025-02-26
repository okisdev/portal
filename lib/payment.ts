import Stripe from 'stripe';

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: '2025-02-24.acacia',
});
