import { auth } from '@/auth';
import { database } from '@/lib/database';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, amount } = body;

    // Find or create contact
    let existingContact = await database.portal_contact.findUnique({
      where: {
        email,
      },
    });

    if (!existingContact) {
      [existingContact] = await database.portal_contact.create({
        data: {
          email,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          status: 'lead',
          assignedTo: session.user.id,
        },
        returning: true,
      });
    }

    // Create payment track
    const [track] = await database.portal_paymentTrack.create({
      data: {
        contactId: existingContact.id,
        userId: session.user.id,
        amount,
        currency: 'usd', // You might want to make this configurable
      },
      returning: true,
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Failed to create payment link:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
