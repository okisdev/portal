'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationTable } from '@/components/shared/pagination-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { campaignTypes } from '@/data/data';
import type { MarketingCampaign } from '@/lib/schema';
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
import { MoreHorizontal, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const campaignFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaignCode: z.string().min(1, 'Campaign code is required'),
  description: z.string().optional(),
  type: z.enum(['email', 'social', 'event', 'referral', 'other']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

type Campaign = {
  id: string;
  name: string;
  campaignCode: string;
  description: string | null;
  type: 'email' | 'social' | 'event' | 'referral' | 'other';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  contactCount: number;
  metrics: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;
};

export default function MarketingCampaignsPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const t = useTranslations();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [editingCampaign, setEditingCampaign] = useState<{
    code: string;
    data: CampaignFormValues;
  } | null>(null);

  const { data: campaigns = [], isLoading } = api.marketing.getAllCampaigns.useQuery();
  const updateCampaign = api.marketing.updateCampaign.useMutation({
    onSuccess: () => {
      toast.success(t('campaign_updated_successfully'));
      setEditingCampaign(null);
      utils.marketing.getAllCampaigns.invalidate();
    },
  });

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: editingCampaign?.data || {
      name: '',
      campaignCode: '',
      description: '',
      type: 'email',
      status: 'draft',
    },
  });

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [campaigns, searchQuery]);

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  const totalContacts = campaigns.reduce((acc, c) => acc + (c.contactCount || 0), 0);

  const onSubmit = async (data: CampaignFormValues) => {
    if (!editingCampaign) return;

    await updateCampaign.mutateAsync({
      code: editingCampaign.code,
      ...data,
    });
  };

  const handleEditCampaign = (e: React.MouseEvent, campaign: MarketingCampaign) => {
    e.stopPropagation();

    const formData = {
      name: campaign.name,
      campaignCode: campaign.campaignCode || '',
      description: campaign.description || '',
      type: campaign.type,
      status: campaign.status,
    };
    setEditingCampaign({
      code: campaign.campaignCode || '',
      data: formData,
    });
    form.reset(formData);
  };

  const columns: ColumnDef<Campaign>[] = [
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
          {t('campaign_name')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
    },
    {
      accessorKey: 'campaignCode',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('code')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
      cell: ({ row }) => row.original.campaignCode || '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('status')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
      cell: ({ row }) => <ColorBadge type='campaignStatus' value={row.original.status} />,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('type')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
      cell: ({ row }) => <span className='capitalize'>{row.original.type}</span>,
    },
    {
      accessorKey: 'contactCount',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('contacts')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
      cell: ({ row }) => row.original.contactCount || 0,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button type='button' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          {t('created')} {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </button>
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-end gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MoreHorizontal className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <button type='button' className='cursor-pointer' onClick={(e) => handleEditCampaign(e, row.original)}>
                  {t('edit')}
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredCampaigns,
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

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={t('campaigns')}
        description={t('campaigns_description')}
        right={
          <Link href='/dashboard/marketing/campaigns/new'>
            <Button variant='outline' size='sm' className='h-8'>
              {t('new_campaign')}
            </Button>
          </Link>
        }
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>{t('active_campaigns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <span className='font-bold text-2xl'>{activeCampaigns.length}</span> / <span>{campaigns.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='font-medium text-sm'>{t('total_contacts')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-bold text-2xl'>{totalContacts}</div>
          </CardContent>
        </Card>
      </div>

      <div className='relative'>
        <SearchIcon className='absolute top-2.5 left-3 h-4 w-4 text-neutral-400' />
        <Input placeholder={t('search_campaigns')} className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <PaginationTable
        table={table}
        columns={columns}
        loading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/marketing/campaigns/${row.id}`)}
        rowClassName='cursor-pointer hover:bg-muted/50'
      />

      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
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
                        <SelectItem value='draft'>{t('draft')}</SelectItem>
                        <SelectItem value='scheduled'>{t('scheduled')}</SelectItem>
                        <SelectItem value='active'>{t('active')}</SelectItem>
                        <SelectItem value='paused'>{t('paused')}</SelectItem>
                        <SelectItem value='completed'>{t('completed')}</SelectItem>
                        <SelectItem value='cancelled'>{t('cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button type='button' variant='outline' onClick={() => setEditingCampaign(null)}>
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
