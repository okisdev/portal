import { notFound } from 'next/navigation';
import { database } from '@/lib/database';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface ClientPageProps {
  params: {
    id: string[];
  };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const clientId = params.id[0];

  const client = await database.client.findUnique({
    where: {
      id: clientId,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>{client.name}</h1>
        <Button variant='outline' asChild>
          <Link href='/dashboard/clients'>Back to Clients</Link>
        </Button>
      </div>

      <div className='grid gap-6'>
        <div className='rounded-lg border p-6'>
          <h2 className='text-xl font-semibold mb-4'>Client Details</h2>
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
            <h2 className='text-xl font-semibold mb-4'>Notes</h2>
            <p className='whitespace-pre-wrap'>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
