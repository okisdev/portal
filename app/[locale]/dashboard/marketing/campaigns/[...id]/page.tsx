'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { ComboboxCommand } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { PaginationTable } from '@/components/shared/pagination-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { CaretSortIcon } from '@radix-ui/react-icons';
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
import { Eye, Filter, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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

export default function CampaignDetailsPage() {
  const router = useRouter();
  const { id: campaignCode } = useParams<{ id: string }>();
  const t = useTranslations();

  const { data: campaign, isLoading: campaignLoading } = api.marketing.getCampaignByCode.useQuery({
    code: campaignCode[0],
  });

  const { data: campaignContacts = [], isLoading: contactsLoading } = api.marketing.getCampaignContacts.useQuery({
    code: campaignCode[0],
  });

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const utils = api.useUtils();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
  });

  const { data: contacts } = api.contact.getAllContacts.useQuery();

  const filterFields = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Company', value: 'company' },
    { label: 'Status', value: 'status' },
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

  const { mutate: removeContact } = api.contact.removeContactFromCampaign.useMutation({
    onSuccess: () => {
      toast.success('Contact removed from campaign');
      utils.marketing.getCampaignContacts.invalidate({ code: campaignCode[0] });
      utils.marketing.getCampaignByCode.invalidate({ code: campaignCode[0] });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    },
  });

  const addContactToCampaign = api.contact.addContactToCampaign.useMutation({
    onSuccess: () => {
      toast.success('Contact added to campaign');
      utils.marketing.getCampaignContacts.invalidate({ code: campaignCode[0] });
    },
  });

  const handleAddMember = (contactId: string) => {
    addContactToCampaign.mutate({
      campaignCode: campaignCode[0],
      contactId,
    });
  };

  const handleFilterChange = (index: number, field: string, operator: FilterOperator, value: string) => {
    const newConditions = [...filters.conditions];
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

  const columns: ColumnDef<any>[] = [
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
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>{row.original.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className='font-medium'>{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Email {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Company {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => <ColorBadge type='contactStatus' value={row.original.status} />,
    },
    {
      accessorKey: 'joinedAt',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Joined Date {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => formatDate(new Date(row.original.joinedAt)),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-end'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={(e) => router.push(`/dashboard/crm/contacts/${row.original.id}?mode=edit`)}>
                <Eye className='mr-2 h-4 w-4' />
                View
              </DropdownMenuItem>
              <DropdownMenuItem className='text-destructive' onClick={(e) => handleDeleteClick(row.original.id, e)}>
                <Trash2 className='mr-2 h-4 w-4' />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const filteredContacts = useMemo(() => {
    if (!campaignContacts) return [];

    return campaignContacts.filter((contact) => {
      if (debouncedSearch) {
        const searchTerm = debouncedSearch.toLowerCase();
        const name = contact.name?.toLowerCase();
        const email = contact.email.toLowerCase();
        const company = (contact.company || '').toLowerCase();
        const status = contact.status.toLowerCase();

        return name?.includes(searchTerm) || email.includes(searchTerm) || company.includes(searchTerm) || status.includes(searchTerm);
      }

      if (filters.conditions.length === 0) return true;

      return filters.conditions.every((condition) => {
        const fieldValue = String(contact[condition.field as keyof typeof contact] || '').toLowerCase();
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
  }, [campaignContacts, filters, debouncedSearch]);

  const table = useReactTable({
    data: filteredContacts,
    columns,
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

  const handleDeleteClick = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (contactToDelete) {
      removeContact({
        contactId: contactToDelete,
        campaignCode: campaignCode[0],
      });
    }
  };

  if (campaignLoading) {
    return <PageLoading />;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={campaign.name}
        description={campaign.description || 'No description'}
        right={
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/marketing/campaigns/${campaignCode}/edit`}>Edit Campaign</Link>
          </Button>
        }
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{campaign.contactCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorBadge type='campaignStatus' value={campaign.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='capitalize'>{campaign.type}</div>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder='Search contacts...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' disabled={contactsLoading} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' disabled={contactsLoading}>
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

                      <Button variant='ghost' size='sm' onClick={() => handleRemoveFilter(index)}>
                        <Trash2 className='h-4 w-4' />
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
                        conditions: [...f.conditions, { field: filterFields[0].value, operator: '=', value: '' }],
                      }));
                    }}
                  >
                    Add Condition
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Popover open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='h-8'>
                <Plus className='mr-1 size-4' /> {t('add_contact')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[300px] p-0' align='end'>
              <ComboboxCommand
                query={searchValue}
                setQuery={setSearchValue}
                value=''
                onChange={handleAddMember}
                setOpen={setIsAddMemberOpen}
                items={
                  contacts
                    ?.filter(
                      (contact) =>
                        !campaignContacts?.some((c) => c.id === contact.id) &&
                        (contact.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
                          contact.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
                          contact.email.toLowerCase().includes(searchValue.toLowerCase()))
                    )
                    .map((contact) => contact.id) ?? []
                }
                searchPlaceholder='Search contacts...'
                emptyText='No contacts found.'
                groupHeading='Contacts'
                allowCustom={false}
                renderItem={(contactId) => {
                  const contact = contacts?.find((c) => c.id === contactId);
                  if (!contact) return null;
                  return (
                    <>
                      <Avatar className='size-6'>
                        <AvatarFallback>{contact.firstName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <p className='text-sm'>
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className='text-muted-foreground text-xs'>{contact.email}</p>
                      </div>
                    </>
                  );
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <PaginationTable
        table={table}
        columns={columns}
        loading={contactsLoading}
        onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
        rowClassName='cursor-pointer hover:bg-muted/50'
      />

      <ActionAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title='Remove Contact'
        description='Are you sure you want to remove this contact from the campaign? This action cannot be undone.'
        confirmText='Remove'
        cancelText='Cancel'
      />
    </div>
  );
}
