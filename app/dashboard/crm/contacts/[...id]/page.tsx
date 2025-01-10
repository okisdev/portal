'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';

export default function ClientIdPage() {
  const params = useParams<{ id: string }>();

  const contactId = params.id;

  const { data: contact } = api.dashboard.getContact.useQuery({
    id: contactId,
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-bold text-3xl tracking-tight'>{contact?.name}</h1>
        <Button variant='outline' asChild>
          <Link href='/dashboard/crm/contacts'>Back to Contacts</Link>
        </Button>
      </div>

      <div className='grid gap-6'>
        <div className='rounded-lg border p-6'>
          <h2 className='mb-4 font-semibold text-xl'>Client Details</h2>
          <dl className='grid gap-3'>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Email</dt>
              <dd className='col-span-2'>{contact.email}</dd>
            </div>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Phone</dt>
              <dd className='col-span-2'>{contact.phone || '—'}</dd>
            </div>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Address</dt>
              <dd className='col-span-2'>{contact.address || '—'}</dd>
            </div>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Created</dt>
              <dd className='col-span-2'>{formatDate(new Date(contact.createdAt))}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
