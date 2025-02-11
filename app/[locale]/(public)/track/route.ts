import { database } from '@/lib/database';
import { stripe } from '@/lib/payment';
import { type NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_APP_URL : 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const trackId = searchParams.get('id');

  if (!trackId) {
    return new NextResponse('Missing tracking ID', { status: 400 });
  }

  try {
    // Update payment track record
    const [track] = await database.portal_paymentTrack.update({
      where: {
        id: trackId,
      },
      data: {
        linkClicked: true,
        clickedAt: new Date(),
        updatedAt: new Date(),
        status: 'clicked',
      },
      returning: true,
    });

    if (!track) {
      return new NextResponse('Invalid tracking ID', { status: 404 });
    }

    // Create activity record for the click
    await database.portal_contactActivity.create({
      data: {
        contactId: track.contactId,
        userId: track.userId,
        type: 'PAYMENT',
        subType: 'PAYMENT_LINK_CLICKED',
        description: `Payment link for ${track.amount / 100} ${track.currency.toUpperCase()} was clicked`,
        metadata: JSON.stringify({
          trackId: track.id,
          amount: track.amount,
          currency: track.currency,
          status: 'clicked',
        }),
      },
    });

    // Create Stripe Payment Intent if not exists
    if (!track.stripePaymentId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: track.amount,
        currency: track.currency,
        metadata: {
          trackId: track.id,
          contactId: track.contactId,
        },
      });

      await database.portal_paymentTrack.update({
        where: {
          id: trackId,
        },
        data: {
          stripePaymentId: paymentIntent.id,
          updatedAt: new Date(),
        },
      });

      // Redirect to Stripe Checkout
      return NextResponse.redirect(`${APP_URL}/api/checkout?payment_intent=${paymentIntent.id}`);
    }

    // If payment intent exists, redirect to existing checkout
    return NextResponse.redirect(`${APP_URL}/api/checkout?payment_intent=${track.stripePaymentId}`);
  } catch (error) {
    console.error('Tracking error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
