'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { getPriorityBadgeColor, getStatusBadgeColor } from '@/utils/color';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Filter } from 'lucide-react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
};

type FilterConfig = {
  status: string[];
  priority: string[];
  source: string[];
};

export default function CRMContactsPage() {
  const { data: contacts } = api.dashboard.getContacts.useQuery();

  const [search, setSearch] = useState('');

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    status: [],
    priority: [],
    source: [],
  });

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        const searchString = `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.phone}`.toLowerCase();
        const matchesSearch = searchString.includes(search.toLowerCase());

        const matchesStatus = filters.status.length === 0 || filters.status.includes(contact.status);
        const matchesPriority = filters.priority.length === 0 || filters.priority.includes(contact.priority ?? 'medium');
        const matchesSource = filters.source.length === 0 || filters.source.includes(contact.source ?? '');

        return matchesSearch && matchesStatus && matchesPriority && matchesSource;
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

  const toggleFilter = (type: keyof FilterConfig, value: string) => {
    setFilters((current) => {
      const currentFilters = current[type];
      return {
        ...current,
        [type]: currentFilters.includes(value) ? currentFilters.filter((item) => item !== value) : [...currentFilters, value],
      };
    });
  };

  const clearFilter = (type: keyof FilterConfig) => {
    setFilters((current) => ({
      ...current,
      [type]: [],
    }));
  };

  return (
    <div className='container mx-auto w-full space-y-4'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder='Search contacts...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Filter className='mr-2 h-4 w-4' />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56'>
                <div className='p-2'>
                  <div className='mb-2 font-medium'>Status</div>
                  {['active', 'inactive', 'lead'].map((status) => (
                    <DropdownMenuItem key={status} onClick={() => toggleFilter('status', status)}>
                      {filters.status.includes(status) ? '✓ ' : ''}
                      <span className='capitalize'>{status}</span>
                    </DropdownMenuItem>
                  ))}
                  <div className='mt-4 mb-2 font-medium'>Priority</div>
                  {['high', 'medium', 'low'].map((priority) => (
                    <DropdownMenuItem key={priority} onClick={() => toggleFilter('priority', priority)}>
                      {filters.priority.includes(priority) ? '✓ ' : ''}
                      <span className='capitalize'>{priority}</span>
                    </DropdownMenuItem>
                  ))}
                  <div className='mt-4 mb-2 font-medium'>Source</div>
                  {['website', 'referral', 'social_media'].map((source) => (
                    <DropdownMenuItem key={source} onClick={() => toggleFilter('source', source)}>
                      {filters.source.includes(source) ? '✓ ' : ''}
                      <span className='capitalize'>{source.replace('_', ' ')}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button asChild>
            <Link href='/dashboard/crm/contacts/new'>Add Contact</Link>
          </Button>
        </div>

        {(filters.status.length > 0 || filters.priority.length > 0 || filters.source.length > 0) && (
          <div className='flex flex-wrap gap-2'>
            {Object.entries(filters).map(
              ([type, values]) =>
                values.length > 0 && (
                  <div key={type} className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-sm capitalize'>{type}:</span>
                    {values.map((value) => (
                      <Badge key={value} variant='secondary' className='flex items-center gap-1'>
                        <span className='capitalize'>{value.replace('_', ' ')}</span>
                        <X className='h-3 w-3 cursor-pointer' onClick={() => toggleFilter(type as keyof FilterConfig, value)} />
                      </Badge>
                    ))}
                    <Button variant='ghost' size='sm' className='h-6 px-2 text-xs' onClick={() => clearFilter(type as keyof FilterConfig)}>
                      Clear
                    </Button>
                  </div>
                )
            )}
          </div>
        )}
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
              <TableHead onClick={() => handleSort('priority')} className='cursor-pointer'>
                Priority {sortConfig.column === 'priority' && <CaretSortIcon className='ml-2 inline' />}
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
                <TableCell>
                  <span className={`inline-block rounded-full px-2 py-1 text-sm ${getPriorityBadgeColor(contact.priority ?? 'medium')}`}>
                    {(contact.priority ?? 'medium').charAt(0).toUpperCase() + (contact.priority ?? 'medium').slice(1)}
                  </span>
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
