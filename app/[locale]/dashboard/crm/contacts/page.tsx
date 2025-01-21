'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { TableLoading } from '@/components/shared/table-loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { sourceSchema, statusSchema } from '@/lib/schema';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Check, ChevronDown, Filter, Import, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: contacts, isLoading } = api.contact.getAllContacts.useQuery();

  const utils = api.useUtils();

  const deleteContact = api.contact.deleteContact.useMutation({
    onSuccess: () => {
      utils.contact.getAllContacts.invalidate();
    },
  });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
  });

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'name', label: 'Name', visible: true },
    { id: 'phone', label: 'Phone', visible: true },
    { id: 'company', label: 'Company', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'source', label: 'Source', visible: true },
    { id: 'priority', label: 'Priority', visible: true },
    { id: 'remark', label: 'Remark', visible: true },
    { id: 'createdAt', label: 'Created', visible: false },
    { id: 'actions', label: 'Actions', visible: true },
  ]);

  const filterFields = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Company', value: 'company' },
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

  const handleStatusFilter = (status: string | null) => {
    if (status === null) {
      // Clear all status filters
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => c.field !== 'status'),
      });
      return;
    }

    // Check if the status is already active
    const isActive = filters.conditions.some((c) => c.field === 'status' && c.value === status);
    if (isActive) {
      // If active, remove it
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => !(c.field === 'status' && c.value === status)),
      });
      return;
    }

    // Add the new status filter without removing existing ones
    setFilters({
      ...filters,
      conditions: [...filters.conditions, { field: 'status', operator: '=', value: status }],
    });
  };

  const handleSourceFilter = (source: string | null) => {
    if (source === null) {
      // Clear all source filters
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => c.field !== 'source'),
      });
      return;
    }

    // Check if the source is already active
    const isActive = filters.conditions.some((c) => c.field === 'source' && c.value === source);
    if (isActive) {
      // If active, remove it
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => !(c.field === 'source' && c.value === source)),
      });
      return;
    }

    // Add the new source filter without removing existing ones
    setFilters({
      ...filters,
      conditions: [...filters.conditions, { field: 'source', operator: '=', value: source }],
    });
  };

  // Initialize filters from URL on mount
  useEffect(() => {
    const newConditions: FilterCondition[] = [];

    // Check for individual filter parameters
    for (const field of filterFields) {
      const values = searchParams.getAll(field.value);
      for (const value of values) {
        newConditions.push({
          field: field.value,
          operator: '=',
          value: value,
        });
      }
    }

    if (newConditions.length > 0) {
      setFilters({
        conditions: newConditions,
        matchAll: true,
      });
    }

    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }

    const sortParam = searchParams.get('sort');
    if (sortParam) {
      try {
        const [column, direction] = sortParam.split(':');
        setSortConfig({ column, direction: direction as 'asc' | 'desc' });
      } catch (e) {
        console.error('Failed to parse sort from URL:', e);
      }
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Clear all filter-related params first
    for (const field of filterFields) {
      params.delete(field.value);
    }

    // Group conditions by field
    const groupedConditions = filters.conditions.reduce((acc, condition) => {
      if (!acc[condition.field]) {
        acc[condition.field] = [];
      }
      acc[condition.field].push(condition.value);
      return acc;
    }, {} as Record<string, string[]>);

    // Update filter parameters
    for (const [field, values] of Object.entries(groupedConditions)) {
      if (values.length === 1) {
        params.set(field, values[0]);
      } else if (values.length > 1) {
        // Delete any existing single value
        params.delete(field);
        // Add each value as a separate parameter
        for (const value of values) {
          params.append(field, value);
        }
      }
    }

    // Update search in URL
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    // Update sort in URL
    if (sortConfig.column) {
      params.set('sort', `${sortConfig.column}:${sortConfig.direction}`);
    } else {
      params.delete('sort');
    }

    // Update URL without causing a page reload
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl);
  }, [filters, search, sortConfig, pathname, searchParams]);

  const handleFilterChange = (index: number, field: string, operator: FilterOperator, value: string) => {
    const newConditions = [...filters.conditions];

    // Remove any existing filter for this field
    const existingIndex = newConditions.findIndex((c) => c.field === field);
    if (existingIndex !== -1 && existingIndex !== index) {
      newConditions.splice(existingIndex, 1);
    }

    if (index >= newConditions.length) {
      newConditions.push({ field, operator, value });
    } else {
      newConditions[index] = { field, operator, value };
    }

    setFilters((prev) => ({
      ...prev,
      conditions: newConditions,
    }));
  };

  const handleRemoveFilter = (index: number) => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        if (debouncedSearch) {
          const searchTerm = debouncedSearch.toLowerCase();
          const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
          const email = contact.email.toLowerCase();
          const status = contact.status.toLowerCase();
          const source = (contact.source || '').toLowerCase();

          return fullName.includes(searchTerm) || email.includes(searchTerm) || status.includes(searchTerm) || source.includes(searchTerm);
        }

        if (filters.conditions.length === 0) return true;

        // Group conditions by field
        const groupedConditions = filters.conditions.reduce((acc, condition) => {
          if (!acc[condition.field]) {
            acc[condition.field] = [];
          }
          acc[condition.field].push(condition);
          return acc;
        }, {} as Record<string, FilterCondition[]>);

        // Check each field group separately
        return Object.entries(groupedConditions).every(([field, conditions]) => {
          // OR operation within the same field
          return conditions.some((condition) => {
            let fieldValue = '';

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
        });
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
  }, [contacts, filters, sortConfig, debouncedSearch]);

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
            <Input placeholder='Search contacts...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' disabled={isLoading} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' disabled={isLoading}>
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
                    <div key={`${condition.field}-${index}`} className='flex items-center gap-2'>
                      <select className='h-8 rounded-md border px-2 text-sm' value={condition.field} onChange={(e) => handleFilterChange(index, e.target.value, condition.operator, condition.value)}>
                        {filterFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className='h-8 rounded-md border px-2 text-sm'
                        value={condition.operator}
                        onChange={(e) => handleFilterChange(index, condition.field, e.target.value as FilterOperator, condition.value)}
                      >
                        {filterOperators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <Input className='h-8' value={condition.value} onChange={(e) => handleFilterChange(index, condition.field, condition.operator, e.target.value)} />

                      <button type='button' className='size-4 p-0' onClick={() => handleRemoveFilter(index)}>
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                  ))}

                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => {
                      setFilters((f) => ({
                        ...f,
                        conditions: [...f.conditions, { field: filterFields[0].value, operator: '=', value: '' }],
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
                <Button variant='outline' size='sm' disabled={isLoading}>
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

            {filters.conditions.length > 0 && (
              <Button variant='outline' size='sm' onClick={() => setFilters({ conditions: [], matchAll: true })}>
                <X className='h-4 w-4' />
                Clear
              </Button>
            )}
          </div>
          <div className='flex flex-row gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='flex h-8 items-center gap-2' disabled={isLoading}>
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

            <Button variant='outline' size='sm' asChild className='h-8' disabled={isLoading}>
              <Link href='/dashboard/crm/contacts/new'>Add Contact</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-muted-foreground text-sm'>Status</p>
          {statusSchema.options.map((status) => {
            const isActive = filters.conditions.some((c) => c.field === 'status' && c.value === status);
            return (
              <button type='button' key={status} onClick={() => handleStatusFilter(status)}>
                <ColorBadge type='contactStatus' value={status} className={cn('capitalize', isActive && 'ring-1 ring-offset-1 ring-offset-background')} />
              </button>
            );
          })}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-muted-foreground text-sm'>Source</p>
          {sourceSchema.options.map((source) => {
            const isActive = filters.conditions.some((c) => c.field === 'source' && c.value === source);
            return (
              <button type='button' key={source} onClick={() => handleSourceFilter(source)}>
                <ColorBadge type='contactStatus' value={source} className={cn('capitalize', isActive && 'ring-1 ring-offset-1 ring-offset-background')} />
              </button>
            );
          })}
        </div>
      </div>

      <div className='rounded-md border'>
        {isLoading ? (
          <TableLoading columnCount={columns.filter((col) => col.visible).length - 1} rowCount={8} />
        ) : (
          <div className='relative'>
            <div className='max-h-[800px] overflow-auto'>
              <Table>
                <TableHeader className='sticky top-0'>
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
                            {column.id === 'phone' && contact.phone}
                            {column.id === 'company' && contact.company}
                            {column.id === 'status' && <ColorBadge type='contactStatus' value={contact.status} />}
                            {column.id === 'source' && <span className='capitalize'>{contact.source?.replace('_', ' ') || '—'}</span>}
                            {column.id === 'priority' && <ColorBadge type='priority' value={contact.priority ?? 'medium'} />}
                            {column.id === 'remark' && contact.remark}
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
                            <DropdownMenuItem className='cursor-pointer' onClick={(e) => handleEdit(contact.id, e)}>
                              <Pencil className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className='cursor-pointer text-destructive' onClick={(e) => handleDeleteClick(contact.id, e)}>
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
          </div>
        )}
      </div>

      <ActionAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title='Delete Contact'
        description='This action cannot be undone. This will permanently delete the contact and remove their data from our servers.'
        confirmText='Delete'
        cancelText='Cancel'
      />
    </div>
  );
}
