import type { Metadata } from 'next';
import { database } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Clients',
  description: 'Manage your clients',
};

export default async function ClientsPage() {
  const clients = await database.client.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className='container mx-auto py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-bold text-3xl tracking-tight'>Clients</h1>
        <Button asChild>
          <Link href='/dashboard/clients/new'>Add Client</Link>
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Link href={`/dashboard/clients/${client.id}`} className='hover:underline'>
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone || '—'}</TableCell>
                <TableCell>{formatDate(client.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
