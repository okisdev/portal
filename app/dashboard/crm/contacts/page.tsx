'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import Link from 'next/link';

export default function CRMContactsPage() {
  const { data: contacts } = api.dashboard.getContacts.useQuery();

  return (
    <div className='container mx-auto w-full space-y-2'>
      <div className='flex items-center justify-end'>
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
                    {contact.firstName} {contact.lastName}
                  </Link>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone || '—'}</TableCell>
                <TableCell>{formatDate(new Date(contact.createdAt))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total: {contacts?.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
