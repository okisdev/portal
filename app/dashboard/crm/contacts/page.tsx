'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import Link from 'next/link';

export default function CRMContactsPage() {
  const { data: contacts } = api.dashboard.getContacts.useQuery();

  return (
    <div className='container mx-auto w-full p-3'>
      <div className='flex items-center justify-between'>
        <Button asChild>
          <Link href='/dashboard/crm/contacts/new'>Add Contact</Link>
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
            {contacts?.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link href={`/dashboard/crm/contacts/${contact.id}`} className='hover:underline'>
                    {contact.name}
                  </Link>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone || '—'}</TableCell>
                <TableCell>{formatDate(new Date(contact.createdAt))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
