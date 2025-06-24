'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { Check, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddContact } from '@/components/dashboard/contact/add-contact';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { SmartColorBadge } from '@/components/shared/smart-color-badge';
import { DataTable } from '@/components/shared/table';
import { DataTableHeader } from '@/components/shared/table/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Priority, Source, Status } from '@/lib/schema';
import type { Locale } from '@/types/i18n';
import { renderDescription } from '@/utils/activity';
import { formatDateWithoutTime } from '@/utils/date';
import { parsePhoneWithoutCountryCode } from '@/utils/phone';
import { api } from '@/utils/trpc/client';

// Define the contact type from the paginated response
type PaginatedContact = {
  id: string;
  name: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  createdAt: Date;
  nextFollowUpAt: Date | null;
  lastContactedAt: Date | null;
  lastActivity: string | null;
};

export default function CRMContactsTablePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const isMobile = useIsMobile();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);

  // Initialize sorting with default values (most recent first)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Handle URL changes and page state
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const sourceParam = searchParams.get('source');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');

    // Handle search parameter
    if (searchParam) {
      setSearch(searchParam);
    } else {
      setSearch('');
    }

    // Handle status filter
    if (statusParam) {
      setStatusFilter(statusParam.split(','));
    } else {
      setStatusFilter([]);
    }

    // Handle priority filter
    if (priorityParam) {
      setPriorityFilter(priorityParam.split(','));
    } else {
      setPriorityFilter([]);
    }

    // Handle source filter
    if (sourceParam) {
      setSourceFilter(sourceParam.split(','));
    } else {
      setSourceFilter([]);
    }

    // Handle sorting parameters
    if (sortByParam && sortOrderParam) {
      setSorting([{ id: sortByParam, desc: sortOrderParam === 'desc' }]);
    }

    setIsInitialLoad(false);
  }, [searchParams]);

  // Batch load all configurations at once
  const { data: configurations } = api.contact.getAllConfigurations.useQuery();

  const statuses = configurations?.statuses || [];
  const priorities = configurations?.priorities || [];
  const sources = configurations?.sources || [];

  const utils = api.useUtils();

  const deleteContact = api.contact.deleteContact.useMutation({
    onSuccess: () => {
      utils.contact.getContactsPaginated.invalidate();
      toast.success(t('contact_deleted_successfully'));
    },
  });

  const updateContact = api.contact.updateContact.useMutation({
    onSuccess: () => {
      utils.contact.getContactsPaginated.invalidate();
      toast.success(t('contact_updated_successfully'));
    },
  });

  // Fetch contacts with server-side pagination and filtering
  const { data: contactsData, isLoading } =
    api.contact.getContactsPaginated.useQuery({
      page: pageIndex + 1,
      pageSize,
      search: debouncedSearch,
      statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
      priorityFilter: priorityFilter.length > 0 ? priorityFilter : undefined,
      sourceFilter: sourceFilter.length > 0 ? sourceFilter : undefined,
      sortBy: sorting[0]?.id as any,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    });

  const contacts = contactsData?.data || [];
  const totalCount = contactsData?.totalCount || 0;
  const totalPages = contactsData?.totalPages || 1;

  // Update URL when search or filters change
  useEffect(() => {
    if (isInitialLoad) return;

    const params = new URLSearchParams();

    if (search) {
      params.set('search', search);
    }

    if (statusFilter.length > 0) {
      params.set('status', statusFilter.join(','));
    }

    if (priorityFilter.length > 0) {
      params.set('priority', priorityFilter.join(','));
    }

    if (sourceFilter.length > 0) {
      params.set('source', sourceFilter.join(','));
    }

    // Add sorting parameters to URL
    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [
    search,
    statusFilter,
    priorityFilter,
    sourceFilter,
    sorting,
    pathname,
    router,
    isInitialLoad,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    if (!isInitialLoad) {
      setPageIndex(0);
    }
  }, [isInitialLoad]);

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
      setRowSelection({}); // Clear selection after deletion
    }
  };

  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    for (const row of selectedRows) {
      deleteContact.mutate({ id: row.original.id });
    }
    setBulkDeleteDialogOpen(false);
    setRowSelection({}); // Clear selection after bulk deletion
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

  const tableColumns: ColumnDef<PaginatedContact>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsAllPageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('name')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8'>
            <AvatarFallback>
              {row.original.firstName?.[0] ??
                row.original.name?.[0] ??
                row.original.email?.[0] ??
                ''}
            </AvatarFallback>
          </Avatar>
          <div className='w-16'>
            <div className='truncate font-medium'>{row.original.name}</div>
            <div className='truncate text-neutral-500 text-xs'>
              {row.original.email}
            </div>
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('phone')} />
      ),
      cell: ({ row }) => (
        <span>
          {row.original.phone
            ? parsePhoneWithoutCountryCode(row.original.phone)
            : '—'}
        </span>
      ),
      enableSorting: false,
      enableHiding: isMobile,
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('company')} />
      ),
      cell: ({ row }) => (
        <span className='capitalize'>{row.original.company || '—'}</span>
      ),
      enableSorting: false,
      enableHiding: isMobile,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(value) => handleStatusChange(row.original.id, value)}
          disabled={updateContact.isPending}
        >
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <SmartColorBadge
                value={row.original.status}
                color={
                  statuses?.find(
                    (s: Status) => s.value === (row.original.status || 'Lead')
                  )?.color || '#6b7280'
                }
              />
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
      enableSorting: true,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('priority')} />
      ),
      cell: ({ row }) => (
        <Select
          value={row.original.priority || 'Medium'}
          onValueChange={(value) =>
            handlePriorityChange(row.original.id, value)
          }
          disabled={updateContact.isPending}
        >
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <SmartColorBadge
                value={row.original.priority || 'Medium'}
                color={
                  priorities?.find(
                    (p: Priority) =>
                      p.value === (row.original.priority || 'Medium')
                  )?.color || '#6b7280'
                }
              />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorities?.map((priority: Priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                <SmartColorBadge
                  value={priority.value}
                  color={priority.color}
                />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      enableSorting: true,
      enableHiding: isMobile,
    },
    {
      accessorKey: 'source',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('source')} />
      ),
      cell: ({ row }) => (
        <Select
          value={row.original.source || 'N/A'}
          onValueChange={(value) => handleSourceChange(row.original.id, value)}
          disabled={updateContact.isPending}
        >
          <SelectTrigger className='h-8 w-[130px]'>
            <SelectValue>
              <SmartColorBadge
                value={row.original.source || 'N/A'}
                color={
                  sources?.find(
                    (s: Source) => s.value === (row.original.source || 'N/A')
                  )?.color || '#6b7280'
                }
              />
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
      enableHiding: isMobile,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('created_at')} />
      ),
      cell: ({ row }) => formatDateWithoutTime(row.original.createdAt),
      enableSorting: true,
      enableHiding: isMobile,
    },
    {
      accessorKey: 'nextFollowUpAt',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('next_follow_up')} />
      ),
      cell: ({ row }) =>
        row.original.nextFollowUpAt
          ? formatDateWithoutTime(row.original.nextFollowUpAt)
          : '—',
      enableSorting: true,
      enableHiding: isMobile,
    },
    {
      accessorKey: 'lastActivity',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('last_activity')} />
      ),
      cell: ({ row }) => {
        const lastActivity = row.original.lastActivity
          ? JSON.parse(row.original.lastActivity)
          : null;

        if (!lastActivity) return '—';

        return (
          <div className='w-32'>
            <p className='truncate whitespace-nowrap text-sm'>
              {renderDescription(lastActivity, t, locale)}
            </p>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: isMobile,
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
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(row.original.id, e)}
              className='text-destructive'
            >
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
    data: contacts,
    columns: tableColumns,
    pageCount: totalPages,
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
        setPageSize(newState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={t('contacts')}
        subtitle={
          !isLoading
            ? `(${t('total_number_contacts', { count: totalCount || 0 })})`
            : undefined
        }
        description={t('contacts_description')}
      />

      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <Input
              placeholder={t('search_contacts')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className='h-8 w-full max-w-sm sm:w-72'
              disabled={isLoading}
            />

            <Combobox
              value={selectedColumn}
              onChange={(value) => {
                setSelectedColumn(value);
                const column = table
                  .getAllColumns()
                  .find((col) => col.id === value);
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
                const column = table
                  .getAllColumns()
                  .find((col) => col.id === item);
                return (
                  <div className='flex w-full items-center justify-between'>
                    <span>{t(item)}</span>
                    {column?.getIsVisible() && <Check className='h-4 w-4' />}
                  </div>
                );
              }}
              className='w-full sm:w-48'
              size='sm'
              alwaysPlaceHolder={true}
            />

            {(statusFilter.length > 0 ||
              sourceFilter.length > 0 ||
              priorityFilter.length > 0) && (
              <Button
                variant='outline'
                size='sm'
                className='h-8'
                onClick={() => {
                  setStatusFilter([]);
                  setSourceFilter([]);
                  setPriorityFilter([]);
                }}
              >
                {t('clear_all_filters')}
              </Button>
            )}
          </div>

          <div className='flex flex-col gap-4 sm:flex-row'>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex h-8 items-center gap-2'
                  >
                    <MoreHorizontal className='mr-2 h-4 w-4' />
                    {t('bulk_actions')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className='cursor-pointer text-destructive'
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    {t('delete_selected')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <AddContact isLoading={isLoading} />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-muted-foreground text-sm'>{t('status')}</p>
            {statuses?.map((status: Status) => {
              const isActive = statusFilter.includes(status.value);
              return (
                <button
                  type='button'
                  key={status.value}
                  onClick={() => {
                    if (isActive) {
                      setStatusFilter(
                        statusFilter.filter((s) => s !== status.value)
                      );
                    } else {
                      setStatusFilter([...statusFilter, status.value]);
                    }
                  }}
                >
                  <SmartColorBadge
                    value={status.value}
                    color={status.color}
                    isActive={isActive}
                  />
                </button>
              );
            })}
          </div>
          {statusFilter.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={() => setStatusFilter([])}
            >
              {t('clear')}
            </Button>
          )}
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-muted-foreground text-sm'>{t('source')}</p>
            {sources?.map((source: Source) => {
              const isActive = sourceFilter.includes(source.value);
              return (
                <button
                  type='button'
                  key={source.value}
                  onClick={() => {
                    if (isActive) {
                      setSourceFilter(
                        sourceFilter.filter((s) => s !== source.value)
                      );
                    } else {
                      setSourceFilter([...sourceFilter, source.value]);
                    }
                  }}
                >
                  <SmartColorBadge
                    value={source.value}
                    color={source.color}
                    isActive={isActive}
                  />
                </button>
              );
            })}
          </div>
          {sourceFilter.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={() => setSourceFilter([])}
            >
              {t('clear')}
            </Button>
          )}
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-muted-foreground text-sm'>{t('priority')}</p>
            {priorities?.map((priority: Priority) => {
              const isActive = priorityFilter.includes(priority.value);
              return (
                <button
                  type='button'
                  key={priority.value}
                  onClick={() => {
                    if (isActive) {
                      setPriorityFilter(
                        priorityFilter.filter((p) => p !== priority.value)
                      );
                    } else {
                      setPriorityFilter([...priorityFilter, priority.value]);
                    }
                  }}
                >
                  <SmartColorBadge
                    value={priority.value}
                    color={priority.color}
                    isActive={isActive}
                  />
                </button>
              );
            })}
          </div>
          {priorityFilter.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={() => setPriorityFilter([])}
            >
              {t('clear')}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        table={table}
        columns={tableColumns}
        loading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
      />

      <ActionAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={t('delete_contact')}
        description={t('delete_contact_description')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />

      <ActionAlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title={t('delete_selected_contacts')}
        description={t('delete_selected_contacts_description', {
          count: table.getFilteredSelectedRowModel().rows.length,
        })}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />
    </div>
  );
}
