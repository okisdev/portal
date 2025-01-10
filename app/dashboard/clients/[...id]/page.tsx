import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ClientIdPage({ params }: { params: Promise<{ id: string }> }) {
  const clientId = (await params).id;

  const client = await api.dashboard.getClient(clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-bold text-3xl tracking-tight'>{client.name}</h1>
        <Button variant='outline' asChild>
          <Link href='/dashboard/clients'>Back to Clients</Link>
        </Button>
      </div>

      <div className='grid gap-6'>
        <div className='rounded-lg border p-6'>
          <h2 className='mb-4 font-semibold text-xl'>Client Details</h2>
          <dl className='grid gap-3'>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Email</dt>
              <dd className='col-span-2'>{client.email}</dd>
            </div>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Phone</dt>
              <dd className='col-span-2'>{client.phone || '—'}</dd>
            </div>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Address</dt>
              <dd className='col-span-2'>{client.address || '—'}</dd>
            </div>
            <div className='grid grid-cols-3'>
              <dt className='font-medium'>Created</dt>
              <dd className='col-span-2'>{formatDate(client.createdAt)}</dd>
            </div>
          </dl>
        </div>

        {client.notes && (
          <div className='rounded-lg border p-6'>
            <h2 className='mb-4 font-semibold text-xl'>Notes</h2>
            <p className='whitespace-pre-wrap'>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
