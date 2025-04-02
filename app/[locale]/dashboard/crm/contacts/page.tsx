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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { type Contact, type Priority, type Source, type Status, prioritySchema, sourceSchema, statusSchema } from '@/lib/schema';
import { formatDateWithoutTime } from '@/utils/date';
import { parsePhoneWithoutCountryCode } from '@/utils/phone';
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
import { Check, Eye, Import, MoreHorizontal, Trash2, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();

  const { data: contacts, isLoading } = api.contact.getAllContacts.useQuery();

  const utils = api.useUtils();

  const deleteContact = api.contact.deleteContact.useMutation({
    onSuccess: () => {
      utils.contact.getAllContacts.invalidate();
    },
  });

  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      utils.contact.getAllContacts.invalidate();
      toast.success(t('contact_updated_successfully'));
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
    { label: t('name'), value: 'name' },
    { label: t('email'), value: 'email' },
    { label: t('company'), value: 'company' },
    { label: t('status'), value: 'status' },
    { label: t('priority'), value: 'priority' },
    { label: t('source'), value: 'source' },
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

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts
      .filter((contact) => {
        if (debouncedSearch) {
          const searchTerm = debouncedSearch.toLowerCase();
          const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
          const email = contact.email?.toLowerCase() ?? '';
          const status = contact.status.toLowerCase();
          const source = (contact.source || '').toLowerCase();

          return fullName.includes(searchTerm) || email.includes(searchTerm) || status.includes(searchTerm) || source.includes(searchTerm);
        }

        if (filters.conditions.length === 0) return true;

        const groupedConditions = filters.conditions.reduce(
          (acc, condition) => {
            if (!acc[condition.field]) {
              acc[condition.field] = [];
            }
            acc[condition.field].push(condition);
            return acc;
          },
          {} as Record<string, FilterCondition[]>
        );

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

  const handleView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/crm/contacts/${id}`);
  };

  const handleStatusChange = (id: string, value: Status) => {
    updateContact.mutate({
      id,
      status: value,
    });
  };

  const handlePriorityChange = (id: string, value: Priority) => {
    updateContact.mutate({
      id,
      priority: value,
    });
  };

  const handleSourceChange = (id: string, value: Source) => {
    updateContact.mutate({
      id,
      source: value,
    });
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
    },
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarFallback>{row.original.firstName?.[0] ?? row.original.name?.[0] ?? row.original.email?.[0] ?? ''}</AvatarFallback>
          </Avatar>
          <div className='w-16'>
            <div className='truncate font-medium'>{row.original.name}</div>
            <div className='truncate text-neutral-500 text-xs'>{row.original.email}</div>
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'phone',
      header: t('phone'),
      cell: ({ row }) => <span>{row.original.phone ? parsePhoneWithoutCountryCode(row.original.phone) : '—'}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'company',
      header: t('company'),
      cell: ({ row }) => <span className='capitalize'>{row.original.company || '—'}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => (
        <Select value={row.original.status} onValueChange={(value) => handleStatusChange(row.original.id, value as Status)} disabled={updateContact.isPending}>
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <ColorBadge type='contactStatus' value={row.original.status} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statusSchema.options.map((status) => (
              <SelectItem key={status} value={status}>
                <ColorBadge type='contactStatus' value={status} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'priority',
      header: t('priority'),
      cell: ({ row }) => (
        <Select value={row.original.priority || 'medium'} onValueChange={(value) => handlePriorityChange(row.original.id, value as Priority)} disabled={updateContact.isPending}>
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <ColorBadge type='priority' value={row.original.priority || 'medium'} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {prioritySchema.options.map((priority) => (
              <SelectItem key={priority} value={priority}>
                <ColorBadge type='priority' value={priority} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'source',
      header: t('source'),
      cell: ({ row }) => (
        <Select value={row.original.source || 'N/A'} onValueChange={(value) => handleSourceChange(row.original.id, value as Source)} disabled={updateContact.isPending}>
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <ColorBadge type='source' value={row.original.source || 'N/A'} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sourceSchema.options.map((source) => (
              <SelectItem key={source} value={source}>
                <ColorBadge type='source' value={source} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: t('created_at'),
      cell: ({ row }) => formatDateWithoutTime(row.original.createdAt),
      enableSorting: true,
    },
    {
      accessorKey: 'next_follow_up',
      header: t('next_follow_up'),
      cell: ({ row }) => (row.original.nextFollowUpAt ? formatDateWithoutTime(row.original.nextFollowUpAt) : '—'),
      enableSorting: true,
    },
    // {
    //   accessorKey: 'last_activity',
    //   header: t('last_activity'),
    //   cell: ({ row }) => (row.original.lastActivity ? renderDescription(JSON.parse(row.original.lastActivity), t, locale) : '—'),
    //   enableSorting: true,
    // },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>{t('open_menu')}</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={(e) => handleView(row.original.id, e)}>
              <Eye className='mr-2 h-4 w-4' />
              {t('view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleDeleteClick(row.original.id, e)} className='text-destructive'>
              <Trash2 className='mr-2 h-4 w-4' />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredContacts,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('contacts')} subtitle={!isLoading ? `(${t('total_number_contacts', { count: filteredContacts.length })})` : undefined} description={t('contacts_description')} />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder={t('search_contacts')} value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' disabled={isLoading} />

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
              placeholder={t('columns')}
              searchPlaceholder={t('search_columns')}
              emptyText={t('no_columns_found')}
              groupHeading={t('available_columns')}
              allowCustom={false}
              renderItem={(item) => {
                const column = table.getAllColumns().find((col) => col.id === item);
                return (
                  <div className='flex w-full items-center justify-between'>
                    <span className='capitalize'>{t(item)}</span>
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
                {t('clear')}
              </Button>
            )}
          </div>

          <div className='flex flex-row gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='flex h-8 items-center gap-2' disabled={isLoading}>
                  <Import className='mr-2 h-4 w-4' />
                  {t('add_contact')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className='cursor-pointer' onClick={() => router.push('/dashboard/crm/contacts/new?mode=manual')}>
                  <Import className='mr-2 h-4 w-4' />
                  {t('manual')}
                </DropdownMenuItem>
                <DropdownMenuItem className='cursor-pointer' onClick={() => router.push('/dashboard/crm/contacts/new?mode=upload')}>
                  <Upload className='mr-2 h-4 w-4' />
                  {t('upload')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-muted-foreground text-sm'>{t('status')}</p>
          {statusSchema.options.map((status) => {
            const isActive = filters.conditions.some((c) => c.field === 'status' && c.value === status);
            return (
              <button type='button' key={status} onClick={() => handleStatusFilter(status)}>
                <ColorBadge type='contactStatus' value={status} className='capitalize' isActive={isActive} />
              </button>
            );
          })}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-muted-foreground text-sm'>{t('source')}</p>
          {sourceSchema.options.map((source) => {
            const isActive = filters.conditions.some((c) => c.field === 'source' && c.value === source);
            return (
              <button type='button' key={source} onClick={() => handleSourceFilter(source)}>
                <ColorBadge type='source' value={source} className='capitalize' isActive={isActive} />
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
        title={t('delete_contact')}
        description={t('delete_contact_description')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />
    </div>
  );
}
