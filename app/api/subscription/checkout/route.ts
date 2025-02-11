import { database } from '@/lib/database';
import { stripe } from '@/lib/payment';
import { type NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, couponCode, contactId } = body;

    if (!email || !couponCode || !contactId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the coupon details from the database
    const coupon = await database.portal_subscriptionCoupon.findUnique({
      where: {
        code: couponCode,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Get the price for the plan
    const prices = await stripe.prices.list({
      product: coupon.planId,
      active: true,
      limit: 1,
    });

    if (!prices.data[0]) {
      return NextResponse.json({ error: 'No price found for the plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${APP_URL}/payment?mode=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payment?mode=cancel`,
      metadata: {
        contactId,
        couponCode,
      },
      customer_email: email,
      ...(coupon.discountPercent > 0 && {
        discounts: [
          {
            coupon: couponCode,
          },
        ],
      }),
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
