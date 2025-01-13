'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Filter } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
};

export default function CRMContactsPage() {
  const { data: contacts } = api.dashboard.getContacts.useQuery();

  const [search, setSearch] = useState('');

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState({
    hasEmail: false,
    hasPhone: false,
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        const searchString = `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.phone}`.toLowerCase();
        const matchesSearch = searchString.includes(search.toLowerCase());

        const matchesFilters = (!filters.hasEmail || contact.email) && (!filters.hasPhone || contact.phone);

        return matchesSearch && matchesFilters;
      })
      .sort((a, b) => {
        if (!sortConfig.column) return 0;

        const aValue = a[sortConfig.column as keyof typeof a] ?? '';
        const bValue = b[sortConfig.column as keyof typeof b] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [contacts, search, sortConfig, filters]);

  const handleSort = (column: string) => {
    setSortConfig((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'churned':
        return 'bg-red-100 text-red-800';
      case 'opportunity':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className='container mx-auto w-full space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-row gap-2'>
          <Input placeholder='Search contacts...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' />
          <div className='flex items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Filter className='mr-2 h-4 w-4' />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilters((f) => ({ ...f, hasEmail: !f.hasEmail }))}>{filters.hasEmail ? '✓ ' : ''} Has Email</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters((f) => ({ ...f, hasPhone: !f.hasPhone }))}>{filters.hasPhone ? '✓ ' : ''} Has Phone</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Button asChild>
          <Link href='/dashboard/crm/contacts/new'>Add Contact</Link>
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('firstName')} className='cursor-pointer'>
                Name {sortConfig.column === 'firstName' && <CaretSortIcon className='ml-2 inline' />}
              </TableHead>
              <TableHead onClick={() => handleSort('email')} className='cursor-pointer'>
                Email {sortConfig.column === 'email' && <CaretSortIcon className='ml-2 inline' />}
              </TableHead>
              <TableHead onClick={() => handleSort('status')} className='cursor-pointer'>
                Status {sortConfig.column === 'status' && <CaretSortIcon className='ml-2 inline' />}
              </TableHead>
              <TableHead onClick={() => handleSort('source')} className='cursor-pointer'>
                Source {sortConfig.column === 'source' && <CaretSortIcon className='ml-2 inline' />}
              </TableHead>
              <TableHead onClick={() => handleSort('createdAt')} className='cursor-pointer'>
                Created {sortConfig.column === 'createdAt' && <CaretSortIcon className='ml-2 inline' />}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link href={`/dashboard/crm/contacts/${contact.id}`} className='hover:underline'>
                    {contact.firstName} {contact.lastName}
                  </Link>
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2 py-1 text-sm ${getStatusBadgeColor(contact.status)}`}>{contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}</span>
                </TableCell>
                <TableCell>
                  <span className='capitalize'>{contact.source?.replace('_', ' ') || '—'}</span>
                </TableCell>
                <TableCell>{formatDate(new Date(contact.createdAt))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>
                Showing {filteredContacts.length} of {contacts?.length} contacts
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
