'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';

export default function ClientIdPage() {
  const { id: contactId } = useParams<{ id: string }>();

  const { data: contacts } = api.dashboard.getContacts.useQuery();

  const contact = contacts?.find((contact) => contact.id === contactId[0]);

  if (!contact) {
    notFound();
  }

  return (
    <div className='container mx-auto space-y-2'>
      <div className='flex items-center space-x-2'>
        <Button variant='ghost' asChild>
          <Link href='/dashboard/crm/contacts'>
            <MoveLeft className='size-4' />
          </Link>
        </Button>
        <h1 className='font-bold text-3xl tracking-tight'>{contact?.name}</h1>
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
