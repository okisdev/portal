'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { DataTable } from '@/components/shared/table';
import { DataTableHeader } from '@/components/shared/table/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import type { Contact, Priority, Source, Status } from '@/lib/schema';
import type { Locale } from '@/types/i18n';
import { renderDescription } from '@/utils/activity';
import { formatDateWithoutTime } from '@/utils/date';
import { parsePhoneWithoutCountryCode } from '@/utils/phone';
import { api } from '@/utils/trpc/client';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, Eye, Import, MoreHorizontal, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function CRMContactsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  // Handle initial page load and URL changes
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = Number.parseInt(pageParam, 10);
      if (!Number.isNaN(page) && page > 0) {
        // Convert 1-based page to 0-based index
        setPageIndex(page - 1);
      } else {
        // If invalid page number, redirect to page 1
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');
        const newUrl = `${pathname}?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
      }
    } else {
      // If no page parameter, set it to 1
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      const newUrl = `${pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const { data: contactsData, isLoading } = api.contact.getContactsByPagination.useQuery({
    page: pageIndex,
    limit: pageSize,
  });

  const { data: totalCount } = api.contact.getAllContactsCount.useQuery();

  const contacts = contactsData || [];
  const { data: statuses } = api.site.getStatus.useQuery();
  const { data: priorities } = api.site.getPriority.useQuery();
  const { data: sources } = api.site.getSource.useQuery();

  const utils = api.useUtils();

  const deleteContact = api.contact.deleteContact.useMutation({
    onSuccess: () => {
      utils.contact.getContactsByPagination.invalidate();
      utils.contact.getAllContactsCount.invalidate();
      toast.success(t('contact_deleted_successfully'));
    },
  });

  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      utils.contact.getContactsByPagination.invalidate();
      toast.success(t('contact_updated_successfully'));
    },
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const [selectedColumn, setSelectedColumn] = useState<string>('');

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    } else {
      setSearch('');
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (search) {
      params.set('search', search);
    }
    // Always include page parameter
    params.set('page', (pageIndex + 1).toString());

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [search, pageIndex, pathname]);

  // Reset to first page when search changes
  useEffect(() => {
    setPageIndex(0);
  }, [search]);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    return contacts.filter((contact) => {
      if (debouncedSearch) {
        const searchTerm = debouncedSearch.toLowerCase();
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const email = contact.email?.toLowerCase() ?? '';
        const status = contact.status.toLowerCase();
        const source = (contact.source || '').toLowerCase();

        return fullName.includes(searchTerm) || email.includes(searchTerm) || status.includes(searchTerm) || source.includes(searchTerm);
      }
      return true;
    });
  }, [contacts, debouncedSearch]);

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

  const handleStatusChange = (id: string, value: string) => {
    updateContact.mutate({
      id,
      status: value,
    });
  };

  const handlePriorityChange = (id: string, value: string) => {
    updateContact.mutate({
      id,
      priority: value,
    });
  };

  const handleSourceChange = (id: string, value: string) => {
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsAllPageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Select row' />,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableHeader column={column} title={t('name')} />,
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
      enableSorting: false,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => <DataTableHeader column={column} title={t('phone')} />,
      cell: ({ row }) => <span>{row.original.phone ? parsePhoneWithoutCountryCode(row.original.phone) : '—'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'company',
      header: ({ column }) => <DataTableHeader column={column} title={t('company')} />,
      cell: ({ row }) => <span className='capitalize'>{row.original.company || '—'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableHeader column={column} title={t('status')} />,
      cell: ({ row }) => (
        <Select value={row.original.status} onValueChange={(value) => handleStatusChange(row.original.id, value)} disabled={updateContact.isPending}>
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <SmartColorBadge value={row.original.status} color={statuses?.find((s: Status) => s.value === (row.original.status || 'Lead'))?.color || '#6b7280'} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statuses?.map((status: Status) => (
              <SelectItem key={status.value} value={status.value}>
                <SmartColorBadge value={status.value} color={status.color} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => <DataTableHeader column={column} title={t('priority')} />,
      cell: ({ row }) => (
        <Select value={row.original.priority || 'Medium'} onValueChange={(value) => handlePriorityChange(row.original.id, value)} disabled={updateContact.isPending}>
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <SmartColorBadge value={row.original.priority || 'Medium'} color={priorities?.find((p: Priority) => p.value === (row.original.priority || 'Medium'))?.color || '#6b7280'} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorities?.map((priority: Priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                <SmartColorBadge value={priority.value} color={priority.color} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'source',
      header: ({ column }) => <DataTableHeader column={column} title={t('source')} />,
      cell: ({ row }) => (
        <Select value={row.original.source || 'N/A'} onValueChange={(value) => handleSourceChange(row.original.id, value)} disabled={updateContact.isPending}>
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <SmartColorBadge value={row.original.source || 'N/A'} color={sources?.find((s: Source) => s.value === (row.original.source || 'N/A'))?.color || '#6b7280'} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sources?.map((source: Source) => (
              <SelectItem key={source.value} value={source.value}>
                <SmartColorBadge value={source.value} color={source.color} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableHeader column={column} title={t('created_at')} />,
      cell: ({ row }) => formatDateWithoutTime(row.original.createdAt),
      enableSorting: true,
    },
    {
      accessorKey: 'next_follow_up',
      header: ({ column }) => <DataTableHeader column={column} title={t('next_follow_up')} />,
      cell: ({ row }) => (row.original.nextFollowUpAt ? formatDateWithoutTime(row.original.nextFollowUpAt) : '—'),
      enableSorting: true,
    },
    {
      accessorKey: 'lastActivity',
      header: ({ column }) => <DataTableHeader column={column} title={t('last_activity')} />,
      cell: ({ row }) => {
        const lastActivity = row.original.lastActivity ? JSON.parse(row.original.lastActivity) : null;

        if (!lastActivity) return '—';

        return (
          <div className='w-32'>
            <p className='truncate whitespace-nowrap text-sm'>{renderDescription(lastActivity, t, locale)}</p>
          </div>
        );
      },
      enableSorting: false,
    },
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
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: filteredContacts,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    pageCount: totalCount ? Math.ceil(totalCount.count / pageSize) : 0,
    manualPagination: true,
  });

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('contacts')} subtitle={!isLoading ? `(${t('total_number_contacts', { count: totalCount?.count || 0 })})` : undefined} description={t('contacts_description')} />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
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
              placeholder={t('visible_columns')}
              searchPlaceholder={t('search_columns')}
              emptyText={t('no_columns_found')}
              groupHeading={t('visible_columns')}
              allowCustom={false}
              renderItem={(item) => {
                const column = table.getAllColumns().find((col) => col.id === item);
                return (
                  <div className='flex w-full items-center justify-between'>
                    <span>{t(item)}</span>
                    {column?.getIsVisible() && <Check className='h-4 w-4' />}
                  </div>
                );
              }}
              className='w-48'
              size='sm'
              alwaysPlaceHolder={true}
            />
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

      <DataTable table={table} columns={tableColumns} loading={isLoading} onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)} />

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
