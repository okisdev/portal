'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationTable } from '@/components/shared/pagination-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import { SearchIcon } from 'lucide-react';
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
      toast.success('Campaign updated successfully');
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
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Campaign Name {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/dashboard/marketing/campaigns/${row.original.campaignCode}`} className='hover:underline font-medium'>
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'campaignCode',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Code {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.campaignCode || '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => <ColorBadge type='campaignStatus' value={row.original.status} />,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Type {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => <span className='capitalize'>{row.original.type}</span>,
    },
    {
      accessorKey: 'contactCount',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Contacts {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => row.original.contactCount || 0,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created {column.getIsSorted() && <CaretSortIcon className='ml-2 inline' />}
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex justify-end gap-2'>
          <Button variant='outline' size='sm' onClick={(e) => handleEditCampaign(e, row.original)}>
            Edit
          </Button>
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
        title={t('marketing_campaigns')}
        description={t('marketing_campaigns_description')}
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
            <div className='font-bold text-2xl'>{activeCampaigns.length}</div>
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
        onRowClick={(row) => router.push(`/dashboard/marketing/campaigns/${row.campaignCode}`)}
        rowClassName='cursor-pointer hover:bg-muted/50'
      />

      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Campaign Code</FormLabel>
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
                    <FormLabel>Description</FormLabel>
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
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='email'>Email</SelectItem>
                        <SelectItem value='social'>Social</SelectItem>
                        <SelectItem value='event'>Event</SelectItem>
                        <SelectItem value='referral'>Referral</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='draft'>Draft</SelectItem>
                        <SelectItem value='scheduled'>Scheduled</SelectItem>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='paused'>Paused</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
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
