'use server';

import { auth } from '@/auth';
import { contact, paymentTrack } from '@/drizzle/schema';
import { database } from '@/lib/database';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { columns } from './columns';
import { CreatePaymentLink } from './create-payment-link';
import { DataTable } from './data-table';

async function getPaymentLinks() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const results = await database
    .select()
    .from(paymentTrack)
    .where(eq(paymentTrack.userId, session.user.id))
    .innerJoin(contact, eq(paymentTrack.contactId, contact.id))
    .orderBy(desc(paymentTrack.createdAt));

  return results.map(({ paymentTrack, contact }) => ({
    ...paymentTrack,
    contact: {
      id: contact.id,
      name: contact.name ?? '',
      email: contact.email,
    },
  }));
}

export default async function PaymentLinksPage() {
  const paymentLinks = await getPaymentLinks();

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='font-bold text-2xl tracking-tight'>Payment Links</h1>
          <p className='text-muted-foreground'>Create and manage payment links for your contacts</p>
        </div>
        <CreatePaymentLink />
      </div>

      <DataTable columns={columns} data={paymentLinks} />
    </div>
  );
}
