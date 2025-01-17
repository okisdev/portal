'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { DeleteAlertDialog } from '@/components/shared/delete-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import {} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Check, ChevronDown, Filter, Import, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  matchAll: boolean;
};

type ColumnConfig = {
  id: string;
  label: string;
  visible: boolean;
};

export default function CRMContactsPage() {
  const router = useRouter();

  const { data: contacts } = api.contact.getAllContacts.useQuery();

  const utils = api.useUtils();

  const deleteContact = api.contact.deleteContact.useMutation({
    onSuccess: () => {
      utils.contact.getAllContacts.invalidate();
    },
  });

  const [search, setSearch] = useState('');

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
  });

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'name', label: 'Name', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'source', label: 'Source', visible: true },
    { id: 'priority', label: 'Priority', visible: true },
    { id: 'createdAt', label: 'Created', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ]);

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        // Apply search filter
        if (search) {
          const searchTerm = search.toLowerCase();
          const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
          const email = contact.email.toLowerCase();
          const status = contact.status.toLowerCase();
          const source = (contact.source || '').toLowerCase();

          return fullName.includes(searchTerm) || email.includes(searchTerm) || status.includes(searchTerm) || source.includes(searchTerm);
        }

        // Apply filter conditions
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

        let aValue: string | Date;
        let bValue: string | Date;

        if (sortConfig.column === 'name') {
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
        } else if (sortConfig.column === 'createdAt') {
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
        } else {
          aValue = String(a[sortConfig.column as keyof typeof a] ?? '');
          bValue = String(b[sortConfig.column as keyof typeof b] ?? '');
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [contacts, filters, sortConfig, search]);

  const handleSort = (column: string) => {
    setSortConfig((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (contactToDelete) {
      await deleteContact.mutate({ id: contactToDelete });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/crm/contacts/${id}?mode=edit`);
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title='Contacts' description='Manage contacts' />

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Check className='mr-2 h-4 w-4' />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.visible}
                    onCheckedChange={(checked) => {
                      setColumns((prev) => prev.map((col) => (col.id === column.id ? { ...col, visible: checked } : col)));
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className='flex flex-row gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='flex h-8 items-center gap-2'>
                  Import
                  <ChevronDown className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className='cursor-pointer' onClick={() => router.push('/dashboard/crm/contacts/new?mode=simple')}>
                  <Import className='mr-2 h-4 w-4' />
                  Basic CSV
                </DropdownMenuItem>
                <DropdownMenuItem className='cursor-pointer' onClick={() => toast.info('Coming soon!')}>
                  <Import className='mr-2 h-4 w-4' />
                  Existing CRM
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
              {columns.map((column) =>
                column.visible ? (
                  <TableHead key={column.id} onClick={() => handleSort(column.id)} className={cn('cursor-pointer', column.label === 'Actions' && 'text-right')}>
                    {column.label} {sortConfig.column === column.id && <CaretSortIcon className='ml-2 inline' />}
                  </TableHead>
                ) : null
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id} className='cursor-pointer hover:bg-muted/50' onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                {columns.map((column) =>
                  column.visible ? (
                    <TableCell key={column.id}>
                      {column.id === 'name' && (
                        <div className='flex items-center gap-2'>
                          <Avatar className='size-8'>
                            <AvatarFallback>{contact.firstName?.[0] ?? contact.name?.[0] ?? contact.email?.[0] ?? ''}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>{contact.name}</div>
                            <div className='text-neutral-500 text-xs'>{contact.email}</div>
                          </div>
                        </div>
                      )}
                      {column.id === 'email' && contact.email}
                      {column.id === 'status' && <ColorBadge type='contactStatus' value={contact.status} />}
                      {column.id === 'source' && <span className='capitalize'>{contact.source?.replace('_', ' ') || '—'}</span>}
                      {column.id === 'priority' && <ColorBadge type='priority' value={contact.priority ?? 'medium'} />}
                      {column.id === 'createdAt' && formatDate(new Date(contact.createdAt))}
                    </TableCell>
                  ) : null
                )}
                <TableCell className='w-[50px]'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={(e) => handleEdit(contact.id, e)}>
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className='text-red-600' onClick={(e) => handleDeleteClick(contact.id, e)}>
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
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

      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        description='This action cannot be undone. This will permanently delete the contact and remove their data from our servers.'
      />
    </div>
  );
}
