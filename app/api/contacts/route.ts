import { contact } from '@/drizzle/schema';
import { database } from '@/lib/database';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, source, status } = await req.json();

    // Check if contact already exists
    const existingContact = await database.select().from(contact).where(eq(contact.email, email));

    if (existingContact) {
      return NextResponse.json(existingContact);
    }

    // Create new contact
    const [newContact] = await database
      .insert(contact)
      .values({
        email,
        firstName: '', // These can be updated later
        lastName: '',
        source,
        status,
      })
      .returning();

    return NextResponse.json(newContact);
  } catch (error) {
    console.error('Failed to create contact:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
