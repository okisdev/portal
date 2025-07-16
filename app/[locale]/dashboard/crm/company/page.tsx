'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Check,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { PhoneInput } from '@/components/shared/phone-input';
import { DataTable } from '@/components/shared/table';
import { DataTableHeader } from '@/components/shared/table/header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/utils/trpc/client';

type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
};

const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.email('Please input a valid email').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type CreateCompanySchema = z.infer<typeof createCompanySchema>;

export default function CompanyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const { data: companies, isLoading } = api.company.getAllCompanies.useQuery();

  const utils = api.useUtils();

  const deleteCompany = api.company.deleteCompany.useMutation({
    onSuccess: () => {
      utils.company.getAllCompanies.invalidate();
    },
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: '',
    direction: 'asc',
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const createCompanyForm = useForm({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      description: '',
      industry: '',
      size: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      phone: '',
      email: '',
      status: 'active',
    },
  });

  const createCompany = api.company.createCompany.useMutation({
    onSuccess: () => {
      utils.company.getAllCompanies.invalidate();
      setCreateDialogOpen(false);
      createCompanyForm.reset();
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const [selectedColumn, setSelectedColumn] = useState<string>('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const editCompanyForm = useForm({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      description: '',
      industry: '',
      size: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      phone: '',
      email: '',
      status: 'active',
    },
  });

  const editCompany = api.company.updateCompany.useMutation({
    onSuccess: () => {
      utils.company.getAllCompanies.invalidate();
      setEditDialogOpen(false);
      setSelectedCompany(null);
      editCompanyForm.reset();
    },
  });

  useEffect(() => {
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

    if (search) {
      params.set('search', search);
    }

    if (sortConfig.column) {
      params.set('sort', `${sortConfig.column}:${sortConfig.direction}`);
    }

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl, { scroll: false });
  }, [search, sortConfig, pathname]);

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];

    return companies
      .filter((company) => {
        if (debouncedSearch) {
          const searchTerm = debouncedSearch.toLowerCase();
          const name = company.name.toLowerCase();
          const industry = (company.industry || '').toLowerCase();
          const email = (company.email || '').toLowerCase();
          const status = company.status?.toLowerCase();

          return (
            name.includes(searchTerm) ||
            industry.includes(searchTerm) ||
            email.includes(searchTerm) ||
            status?.includes(searchTerm)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (!sortConfig.column) return 0;

        let aValue = String(a[sortConfig.column as keyof typeof a] ?? '');
        let bValue = String(b[sortConfig.column as keyof typeof b] ?? '');

        if (sortConfig.column === 'createdAt') {
          aValue = new Date(a.createdAt).getTime().toString();
          bValue = new Date(b.createdAt).getTime().toString();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [companies, sortConfig, debouncedSearch]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (companyToDelete) {
      deleteCompany.mutate({ id: companyToDelete });
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleEdit = (company: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    editCompanyForm.reset({
      name: company.name,
      description: company.description || '',
      industry: company.industry || '',
      size: company.size || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      postalCode: company.postalCode || '',
      phone: company.phone || '',
      email: company.email || '',
      status: company.status,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = (data: CreateCompanySchema) => {
    if (!selectedCompany) return;
    editCompany.mutate({
      id: selectedCompany.id,
      ...data,
    });
  };

  const onSubmit = (data: CreateCompanySchema) => {
    createCompany.mutate(data);
  };

  const tableColumns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label='Select all'
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label='Select row'
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('name')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <div>
            <div className='font-medium'>{row.original.name}</div>
            <div className='text-neutral-500 text-xs'>
              {row.original.email || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('industry')} />
      ),
      cell: ({ row }) => (
        <span className='capitalize'>{row.original.industry || '—'}</span>
      ),
    },
    {
      accessorKey: 'size',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('size')} />
      ),
      cell: ({ row }) => (
        <span className='capitalize'>{row.original.size || '—'}</span>
      ),
    },
    {
      accessorKey: 'teams',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('teams')} />
      ),
      cell: ({ row }) => <span>{row.original.teams || 0}</span>,
    },
    // {
    //   accessorKey: 'contacts',
    //   header: t('contacts'),
    //   cell: ({ row }) => <span>{row.original.contacts || 0}</span>,
    // },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => (
        <ColorBadge type='companyStatus' value={row.original.status || ''} />
      ),
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('phone')} />
      ),
      cell: ({ row }) => <span>{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'website',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('website')} />
      ),
      cell: ({ row }) => (
        <Button
          asChild
          disabled={!row.original.website}
          onClick={(e) => e.stopPropagation()}
          size='sm'
          variant='ghost'
        >
          <Link
            href={row.original.website || ''}
            rel='noopener noreferrer'
            target='_blank'
          >
            {row.original.website ? t('visit') : '—'}
            {row.original.website && <ExternalLink className='h-4 w-4' />}
          </Link>
        </Button>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('created')} />
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button className='h-8 w-8 p-0' variant='ghost'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={(e) => handleEdit(row.original, e)}
            >
              <Pencil className='mr-2 h-4 w-4' />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer text-destructive'
              onClick={(e) => handleDeleteClick(row.original.id, e)}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredCompanies,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        description={t('companies_description')}
        subtitle={
          isLoading
            ? undefined
            : `(${t('total_number_companies', { count: filteredCompanies.length })})`
        }
        title={t('companies')}
      />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-row gap-2'>
            <Input
              className='h-8 w-72 max-w-sm'
              disabled={isLoading}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_companies')}
              value={search}
            />

            <Combobox
              allowCustom={false}
              alwaysPlaceHolder={true}
              className='w-48'
              emptyText={t('no_columns_found')}
              groupHeading={t('visible_columns')}
              items={table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => column.id)}
              onChange={(value) => {
                setSelectedColumn(value);
                const column = table
                  .getAllColumns()
                  .find((col) => col.id === value);
                if (column) {
                  column.toggleVisibility(!column.getIsVisible());
                }
              }}
              placeholder={t('visible_columns')}
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
              searchPlaceholder={t('search_columns')}
              size='sm'
              value={selectedColumn}
            />
          </div>

          <div className='flex flex-row gap-2'>
            <Button
              className='h-8'
              disabled={isLoading}
              onClick={() => setCreateDialogOpen(true)}
              size='sm'
              variant='outline'
            >
              <Plus className='size-4' /> {t('add_company')}
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        loading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/crm/company/${row.id}`)}
        table={table}
      />

      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={t('delete')}
        description='This action cannot be undone. This will permanently delete the company and remove their data from our servers.'
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title='Delete Company'
      />

      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>{t('add_company')}</DialogTitle>
            <DialogDescription>
              {t('add_company_description')}
            </DialogDescription>
          </DialogHeader>

          <Form {...createCompanyForm}>
            <form
              className='space-y-4'
              onSubmit={createCompanyForm.handleSubmit(onSubmit)}
            >
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={createCompanyForm.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='industry'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('industry')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='size'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('size')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='website'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('website')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input {...field} type='email' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('status')}</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>{t('active')}</SelectItem>
                          <SelectItem value='inactive'>
                            {t('inactive')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createCompanyForm.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phone')}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        onChange={field.onChange}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createCompanyForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('description')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={createCompanyForm.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('address')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='city'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('city')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='state'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('state')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='country'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('country')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createCompanyForm.control}
                  name='postalCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('postal_code')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setCreateDialogOpen(false)}
                  type='button'
                  variant='outline'
                >
                  {t('cancel')}
                </Button>
                <Button disabled={createCompany.isPending} type='submit'>
                  {t('create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setEditDialogOpen} open={editDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>{t('edit_company')}</DialogTitle>
            <DialogDescription>
              {t('edit_company_description')}
            </DialogDescription>
          </DialogHeader>

          <Form {...editCompanyForm}>
            <form
              className='space-y-4'
              onSubmit={editCompanyForm.handleSubmit(onEditSubmit)}
            >
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={editCompanyForm.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='industry'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('industry')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='size'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('size')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='website'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('website')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input {...field} type='email' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('phone')}</FormLabel>
                      <FormControl>
                        <PhoneInput
                          onChange={field.onChange}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('status')}</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>{t('active')}</SelectItem>
                          <SelectItem value='inactive'>
                            {t('inactive')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editCompanyForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('description')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={editCompanyForm.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('address')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='city'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('city')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='state'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('state')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='country'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('country')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editCompanyForm.control}
                  name='postalCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('postal_code')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setEditDialogOpen(false)}
                  type='button'
                  variant='outline'
                >
                  {t('cancel')}
                </Button>
                <Button disabled={editCompany.isPending} type='submit'>
                  {t('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
