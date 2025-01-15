'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Filter } from 'lucide-react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
};

type FilterOperator = '=' | '!=' | 'contains' | 'startsWith' | 'endsWith';

type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: string;
};

type FilterConfig = {
  conditions: FilterCondition[];
  matchAll: boolean; // true for AND, false for OR
};

export default function CRMContactsPage() {
  const router = useRouter();
  const { data: contacts } = api.dashboard.getContacts.useQuery();

  const [search, setSearch] = useState('');

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
  });

  const filterFields = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Source', value: 'source' },
  ];

  const filterOperators: { label: string; value: FilterOperator }[] = [
    { label: 'Equals', value: '=' },
    { label: 'Not equals', value: '!=' },
    { label: 'Contains', value: 'contains' },
    { label: 'Starts with', value: 'startsWith' },
    { label: 'Ends with', value: 'endsWith' },
  ];

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        if (filters.conditions.length === 0) return true;

        const results = filters.conditions.map((condition) => {
          let fieldValue = '';

          // Handle composite fields like name
          if (condition.field === 'name') {
            fieldValue = `${contact.firstName} ${contact.lastName}`;
          } else {
            fieldValue = String(contact[condition.field as keyof typeof contact] || '');
          }

          fieldValue = fieldValue.toLowerCase();
          const compareValue = condition.value.toLowerCase();

          switch (condition.operator) {
            case '=':
              return fieldValue === compareValue;
            case '!=':
              return fieldValue !== compareValue;
            case 'contains':
              return fieldValue.includes(compareValue);
            case 'startsWith':
              return fieldValue.startsWith(compareValue);
            case 'endsWith':
              return fieldValue.endsWith(compareValue);
            default:
              return false;
          }
        });

        return filters.matchAll ? results.every(Boolean) : results.some(Boolean);
      })
      .sort((a, b) => {
        if (!sortConfig.column) return 0;

        const aValue = a[sortConfig.column as keyof typeof a] ?? '';
        const bValue = b[sortConfig.column as keyof typeof b] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [contacts, filters, sortConfig]);

  const handleSort = (column: string) => {
    setSortConfig((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Contacts' description='Manage sales contacts' />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder='Search contacts...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Filter className='mr-2 h-4 w-4' />
                  Filters ({filters.conditions.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-[350px] p-4'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm'>Match:</span>
                    <Button variant='ghost' size='sm' onClick={() => setFilters((f) => ({ ...f, matchAll: !f.matchAll }))}>
                      {filters.matchAll ? 'ALL conditions' : 'ANY condition'}
                    </Button>
                  </div>

                  {filters.conditions.map((condition, index) => (
                    <div key={condition.field} className='flex items-center gap-2'>
                      <select
                        className='h-8 rounded-md border px-2 text-sm'
                        value={condition.field}
                        onChange={(e) => {
                          const newConditions = [...filters.conditions];
                          newConditions[index].field = e.target.value;
                          setFilters((f) => ({ ...f, conditions: newConditions }));
                        }}
                      >
                        {filterFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className='h-8 rounded-md border px-2 text-sm'
                        value={condition.operator}
                        onChange={(e) => {
                          const newConditions = [...filters.conditions];
                          newConditions[index].operator = e.target.value as FilterOperator;
                          setFilters((f) => ({ ...f, conditions: newConditions }));
                        }}
                      >
                        {filterOperators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <Input
                        className='h-8'
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...filters.conditions];
                          newConditions[index].value = e.target.value;
                          setFilters((f) => ({ ...f, conditions: newConditions }));
                        }}
                      />

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setFilters((f) => ({
                            ...f,
                            conditions: f.conditions.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => {
                      setFilters((f) => ({
                        ...f,
                        conditions: [...f.conditions, { field: 'name', operator: 'contains', value: '' }],
                      }));
                    }}
                  >
                    Add Condition
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className='flex flex-row gap-2'>
            <Button variant='outline' asChild className='h-8'>
              <Link href='/dashboard/crm/contacts/new'>Upload CSV</Link>
            </Button>
            <Button variant='outline' asChild className='h-8'>
              <Link href='/dashboard/crm/contacts/new'>Add Contact</Link>
            </Button>
          </div>
        </div>
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
              <TableRow key={contact.id} className='cursor-pointer hover:bg-muted/50' onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                <TableCell>
                  {contact.firstName} {contact.lastName}
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>
                  <ColorBadge type='status' value={contact.status} />
                </TableCell>
                <TableCell>
                  <span className='capitalize'>{contact.source?.replace('_', ' ') || '—'}</span>
                </TableCell>
                <TableCell>
                  <ColorBadge type='priority' value={contact.priority ?? 'medium'} />
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
