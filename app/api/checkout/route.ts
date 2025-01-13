import { contact } from '@/drizzle/schema';
import { database } from '@/lib/database';
import { stripe } from '@/lib/payment';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const paymentIntentId = searchParams.get('payment_intent');

  if (!paymentIntentId) {
    return new NextResponse('Missing payment intent ID', { status: 400 });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Get contact email from metadata
    const { contactId } = paymentIntent.metadata;
    const [currentContact] = await database.select({ email: contact.email }).from(contact).where(eq(contact.id, contactId)).execute();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: paymentIntent.currency,
            product_data: {
              name: 'Payment',
            },
            unit_amount: paymentIntent.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payment/cancel`,
      metadata: paymentIntent.metadata,
      customer_email: currentContact?.email,
      customer_creation: 'if_required',
    });

    if (session.url) {
      return NextResponse.redirect(session.url);
    }

    throw new Error('Failed to create checkout session');
  } catch (error) {
    console.error('Checkout error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
