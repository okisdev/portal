import { subscriptionCoupon } from '@/drizzle/schema';
import { database } from '@/lib/database';
import { stripe } from '@/lib/payment';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, couponCode, contactId } = await req.json();

    // Get the subscription plan and coupon details
    const coupon = couponCode ? await database.select().from(subscriptionCoupon).where(eq(subscriptionCoupon.code, couponCode)) : null;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your default price ID
          quantity: 1,
        },
      ],
      discounts: coupon
        ? [
            {
              coupon: coupon.stripeId, // You'll need to store Stripe coupon IDs
            },
          ]
        : [],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      metadata: {
        contactId, // Store the contact ID in metadata
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
