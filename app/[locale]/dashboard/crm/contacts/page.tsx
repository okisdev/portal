'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationTable } from '@/components/shared/pagination-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { type Contact, sourceSchema, statusSchema } from '@/lib/schema';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, Filter, Import, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
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

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
  });

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

  const [selectedColumn, setSelectedColumn] = useState<string>('');

  const handleStatusFilter = (status: string | null) => {
    if (status === null) {
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => c.field !== 'status'),
      });
      return;
    }

    const isActive = filters.conditions.some((c) => c.field === 'status' && c.value === status);
    if (isActive) {
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => !(c.field === 'status' && c.value === status)),
      });
      return;
    }

    setFilters({
      ...filters,
      conditions: [...filters.conditions, { field: 'status', operator: '=', value: status }],
    });
  };

  const handleSourceFilter = (source: string | null) => {
    if (source === null) {
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => c.field !== 'source'),
      });
      return;
    }

    const isActive = filters.conditions.some((c) => c.field === 'source' && c.value === source);
    if (isActive) {
      setFilters({
        ...filters,
        conditions: filters.conditions.filter((c) => !(c.field === 'source' && c.value === source)),
      });
      return;
    }

    setFilters({
      ...filters,
      conditions: [...filters.conditions, { field: 'source', operator: '=', value: source }],
    });
  };

  useEffect(() => {
    const newConditions: FilterCondition[] = [];

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

    setFilters({
      conditions: newConditions,
      matchAll: true,
    });

    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    } else {
      setSearch('');
    }

    const sortParam = searchParams.get('sort');
    if (sortParam) {
      try {
        const [column, direction] = sortParam.split(':');
        setSortConfig({ column, direction: direction as 'asc' | 'desc' });
      } catch (e) {
        console.error('Failed to parse sort from URL:', e);
      }
    } else {
      setSortConfig({ column: '', direction: 'asc' });
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();

    for (const condition of filters.conditions) {
      params.append(condition.field, condition.value);
    }

    if (search) {
      params.set('search', search);
    }

    if (sortConfig.column) {
      params.set('sort', `${sortConfig.column}:${sortConfig.direction}`);
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, search, sortConfig, pathname]);

  const handleFilterChange = (index: number, field: string, operator: FilterOperator, value: string) => {
    const newConditions = [...filters.conditions];

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

        const groupedConditions = filters.conditions.reduce((acc, condition) => {
          if (!acc[condition.field]) {
            acc[condition.field] = [];
          }
          acc[condition.field].push(condition);
          return acc;
        }, {} as Record<string, FilterCondition[]>);

        return Object.entries(groupedConditions).every(([field, conditions]) => {
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

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
      deleteContact.mutate({ id: contactToDelete });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/crm/contacts/${id}?mode=edit`);
  };

  const tableColumns: ColumnDef<Contact>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarFallback>{row.original.firstName?.[0] ?? row.original.name?.[0] ?? row.original.email?.[0] ?? ''}</AvatarFallback>
          </Avatar>
          <div>
            <div className='font-medium'>{row.original.name}</div>
            <div className='text-neutral-500 text-xs'>{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => <span className='capitalize'>{row.original.company || '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ColorBadge type='contactStatus' value={row.original.status} />,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <span className='capitalize'>{row.original.source?.replace('_', ' ') || '—'}</span>,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <ColorBadge type='priority' value={row.original.priority ?? 'medium'} />,
    },
    {
      accessorKey: 'remark',
      header: 'Remark',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(new Date(row.original.createdAt)),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem className='cursor-pointer' onClick={(e) => handleEdit(row.original.id, e)}>
              <Pencil className='mr-2 h-4 w-4' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer text-destructive' onClick={(e) => handleDeleteClick(row.original.id, e)}>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredContacts,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 13,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

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

            <Combobox
              value={selectedColumn}
              onChange={(value) => {
                setSelectedColumn(value);
                const column = table.getAllColumns().find((col) => col.id === value);
                if (column) {
                  column.toggleVisibility(!column.getIsVisible());
                }
              }}
              items={table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => column.id)}
              placeholder='Columns'
              searchPlaceholder='Search columns...'
              emptyText='No columns found'
              groupHeading='Available Columns'
              allowCustom={false}
              renderItem={(item) => {
                const column = table.getAllColumns().find((col) => col.id === item);
                return (
                  <div className='flex w-full items-center justify-between'>
                    <span className='capitalize'>{item}</span>
                    {column?.getIsVisible() && <Check className='h-4 w-4' />}
                  </div>
                );
              }}
              className='w-48'
              size='sm'
              alwaysPlaceHolder={true}
            />
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
                  <Import className='mr-2 h-4 w-4' />
                  Import
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

      <PaginationTable table={table} columns={tableColumns} loading={isLoading} onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)} rowClassName='cursor-pointer' />

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
