'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { ComboboxCommand } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { DataTable } from '@/components/shared/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { campaignTypes } from '@/data/data';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

const campaignFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaignCode: z.string().min(1, 'Campaign code is required'),
  description: z.string().optional(),
  type: z.enum(['email', 'social', 'event', 'referral', 'other']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function CampaignDetailsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();

  const { data: campaign, isLoading: campaignLoading } = api.marketing.getCampaignById.useQuery({
    id: id[0],
  });

  const { data: campaignContacts, isLoading: contactsLoading } = api.marketing.getCampaignContacts.useQuery({
    id: id[0],
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
    { label: t('name'), value: 'name' },
    { label: t('email'), value: 'email' },
    { label: t('company'), value: 'company' },
    { label: t('status'), value: 'status' },
    { label: t('source'), value: 'source' },
  ];

  const filterOperators: { label: string; value: FilterOperator }[] = [
    { label: t('equals'), value: '=' },
    { label: t('not_equals'), value: '!=' },
    { label: t('contains'), value: 'contains' },
    { label: t('starts_with'), value: 'startsWith' },
    { label: t('ends_with'), value: 'endsWith' },
  ];

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const { mutate: removeContact } = api.contact.removeContactFromCampaign.useMutation({
    onSuccess: () => {
      toast.success('Contact removed from campaign');
      utils.marketing.getCampaignContacts.invalidate({ id: id[0] });
      utils.marketing.getCampaignById.invalidate({ id: id[0] });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    },
  });

  const addContactToCampaign = api.contact.addContactToCampaign.useMutation({
    onSuccess: () => {
      toast.success('Contact added to campaign');
      utils.marketing.getCampaignContacts.invalidate({ id: id[0] });
    },
  });

  const handleAddMember = (contactId: string) => {
    if (!campaign?.campaignCode) return;

    addContactToCampaign.mutate({
      campaignCode: campaign?.campaignCode,
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
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('name')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
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
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('email')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('company')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('status')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
      cell: ({ row }) => <ColorBadge type='contactStatus' value={row.original.status} />,
    },
    {
      accessorKey: 'joinedAt',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('joined_date')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
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
                {t('view')}
              </DropdownMenuItem>
              <DropdownMenuItem className='text-destructive' onClick={(e) => handleDeleteClick(row.original.id, e)}>
                <Trash2 className='mr-2 h-4 w-4' />
                {t('remove')}
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
        const email = contact.email?.toLowerCase() ?? '';
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
    if (!campaign?.campaignCode) return;

    if (contactToDelete) {
      removeContact({
        contactId: contactToDelete,
        campaignCode: campaign?.campaignCode,
      });
    }
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const updateCampaign = api.marketing.updateCampaign.useMutation({
    onSuccess: () => {
      toast.success(t('campaign_updated_successfully'));
      setIsEditDialogOpen(false);
      utils.marketing.getCampaignById.invalidate({ id: id[0] });
    },
  });

  const form = useForm({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: campaign?.name || '',
      campaignCode: campaign?.campaignCode || '',
      description: campaign?.description || '',
      type: campaign?.type || 'email',
      status: campaign?.status || 'draft',
    },
  });

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        campaignCode: campaign.campaignCode || '',
        description: campaign.description || '',
        type: campaign.type,
        status: campaign.status,
      });
    }
  }, [campaign, form]);

  const onSubmit = async (data: CampaignFormValues) => {
    if (!campaign?.campaignCode) return;

    await updateCampaign.mutateAsync({
      code: campaign?.campaignCode,
      ...data,
    });
  };

  if (campaignLoading) {
    return <PageLoading />;
  }

  if (!campaign) {
    return <div>{t('campaign_not_found')}</div>;
  }

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={campaign.name}
        description={campaign.description || 'No description'}
        right={
          <Button variant='outline' size='sm' onClick={() => setIsEditDialogOpen(true)}>
            {t('edit_campaign')}
          </Button>
        }
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>{t('total_contacts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{campaign.contactCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>{t('status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorBadge type='campaignStatus' value={campaign.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>{t('type')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='capitalize'>{campaign.type}</div>
          </CardContent>
        </Card>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder={t('search_contacts')} value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' disabled={contactsLoading} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' disabled={contactsLoading}>
                  <Filter className='mr-2 h-4 w-4' />
                  {t('filters')} ({filters.conditions.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-[350px] p-4'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm'>{t('match')}:</span>
                    <Button variant='ghost' size='sm' onClick={() => setFilters((f) => ({ ...f, matchAll: !f.matchAll }))}>
                      {filters.matchAll ? t('all_conditions') : t('any_condition')}
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
                    {t('add_condition')}
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
                          contact.email?.toLowerCase().includes(searchValue.toLowerCase()))
                    )
                    .map((contact) => contact.id) ?? []
                }
                searchPlaceholder={t('search_contacts')}
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

      <DataTable table={table} columns={columns} loading={contactsLoading} onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)} />

      <ActionAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title='Remove Contact'
        description='Are you sure you want to remove this contact from the campaign? This action cannot be undone.'
        confirmText='Remove'
        cancelText='Cancel'
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('edit_campaign')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='campaignCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('campaign_code')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {campaignTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_status')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='draft'>
                          <ColorBadge type='campaignStatus' value='draft' />
                        </SelectItem>
                        <SelectItem value='scheduled'>
                          <ColorBadge type='campaignStatus' value='scheduled' />
                        </SelectItem>
                        <SelectItem value='active'>
                          <ColorBadge type='campaignStatus' value='active' />
                        </SelectItem>
                        <SelectItem value='paused'>
                          <ColorBadge type='campaignStatus' value='paused' />
                        </SelectItem>
                        <SelectItem value='completed'>
                          <ColorBadge type='campaignStatus' value='completed' />
                        </SelectItem>
                        <SelectItem value='cancelled'>
                          <ColorBadge type='campaignStatus' value='cancelled' />
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button type='button' variant='outline' onClick={() => setIsEditDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type='submit' disabled={updateCampaign.isPending}>
                  {updateCampaign.isPending ? t('saving_loading') : t('save_changes')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
