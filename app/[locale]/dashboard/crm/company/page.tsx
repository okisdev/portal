'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { PhoneInput } from '@/components/shared/phone-input';
import { DataTable } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Check, ExternalLink, Filter, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
  email: z.string().optional(),
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

  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });

  const [filters, setFilters] = useState<FilterConfig>({
    conditions: [],
    matchAll: true,
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

  const filterFields = [
    { label: t('name'), value: 'name' },
    { label: t('industry'), value: 'industry' },
    { label: t('size'), value: 'size' },
    { label: t('status'), value: 'status' },
    { label: t('email'), value: 'email' },
    { label: t('phone'), value: 'phone' },
  ];

  const filterOperators: { label: string; value: FilterOperator }[] = [
    { label: t('equals'), value: '=' },
    { label: t('not_equals'), value: '!=' },
    { label: t('contains'), value: 'contains' },
    { label: t('starts_with'), value: 'startsWith' },
    { label: t('ends_with'), value: 'endsWith' },
  ];

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

          return name.includes(searchTerm) || industry.includes(searchTerm) || email.includes(searchTerm) || status?.includes(searchTerm);
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
            const fieldValue = String(company[condition.field as keyof typeof company] || '').toLowerCase();
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
  }, [companies, filters, sortConfig, debouncedSearch]);

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
      header: t('name'),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <div>
            <div className='font-medium'>{row.original.name}</div>
            <div className='text-neutral-500 text-xs'>{row.original.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: t('industry'),
      cell: ({ row }) => <span className='capitalize'>{row.original.industry || '—'}</span>,
    },
    {
      accessorKey: 'size',
      header: t('size'),
      cell: ({ row }) => <span className='capitalize'>{row.original.size || '—'}</span>,
    },
    {
      accessorKey: 'teams',
      header: t('teams'),
      cell: ({ row }) => <span>{row.original.teams || 0}</span>,
    },
    // {
    //   accessorKey: 'contacts',
    //   header: t('contacts'),
    //   cell: ({ row }) => <span>{row.original.contacts || 0}</span>,
    // },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <ColorBadge type='companyStatus' value={row.original.status} />,
    },
    {
      accessorKey: 'phone',
      header: t('phone'),
      cell: ({ row }) => <span>{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'website',
      header: t('website'),
      cell: ({ row }) => (
        <Button variant='ghost' size='sm' disabled={!row.original.website} asChild onClick={(e) => e.stopPropagation()}>
          <Link href={row.original.website} target='_blank' rel='noopener noreferrer'>
            {row.original.website ? t('visit') : '—'}
            {row.original.website && <ExternalLink className='h-4 w-4' />}
          </Link>
        </Button>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('created'),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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
            <DropdownMenuItem className='cursor-pointer' onClick={(e) => handleEdit(row.original, e)}>
              <Pencil className='mr-2 h-4 w-4' />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem className='cursor-pointer text-destructive' onClick={(e) => handleDeleteClick(row.original.id, e)}>
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
      <PageHeader title={t('companies')} subtitle={!isLoading ? `(${t('total_number_companies', { count: filteredCompanies.length })})` : undefined} description={t('companies_description')} />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-row gap-2'>
            <Input placeholder={t('search_companies')} value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 w-72 max-w-sm' disabled={isLoading} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' disabled={isLoading}>
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
                    {t('add_condition')}
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
            <Button variant='outline' size='sm' className='h-8' disabled={isLoading} onClick={() => setCreateDialogOpen(true)}>
              {t('add_company')}
            </Button>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-muted-foreground text-sm'>{t('status')}</p>
          {['active', 'inactive'].map((status) => {
            const isActive = filters.conditions.some((c) => c.field === 'status' && c.value === status);
            return (
              <button type='button' key={status} onClick={() => handleStatusFilter(status)}>
                <ColorBadge type='companyStatus' value={status} className='capitalize' isActive={isActive} />
              </button>
            );
          })}
        </div>
      </div>

      <DataTable table={table} columns={tableColumns} loading={isLoading} onRowClick={(row) => router.push(`/dashboard/crm/company/${row.id}`)} />

      <ActionAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title='Delete Company'
        description='This action cannot be undone. This will permanently delete the company and remove their data from our servers.'
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>{t('add_company')}</DialogTitle>
            <DialogDescription>{t('add_company_description')}</DialogDescription>
          </DialogHeader>

          <Form {...createCompanyForm}>
            <form onSubmit={createCompanyForm.handleSubmit(onSubmit)} className='space-y-4'>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>{t('active')}</SelectItem>
                          <SelectItem value='inactive'>{t('inactive')}</SelectItem>
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
                      <PhoneInput value={field.value || ''} onChange={field.onChange} />
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
                <Button variant='outline' type='button' onClick={() => setCreateDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type='submit' disabled={createCompany.isPending}>
                  {t('create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>{t('edit_company')}</DialogTitle>
            <DialogDescription>{t('edit_company_description')}</DialogDescription>
          </DialogHeader>

          <Form {...editCompanyForm}>
            <form onSubmit={editCompanyForm.handleSubmit(onEditSubmit)} className='space-y-4'>
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
                        <PhoneInput value={field.value || ''} onChange={field.onChange} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>{t('active')}</SelectItem>
                          <SelectItem value='inactive'>{t('inactive')}</SelectItem>
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
                <Button variant='outline' type='button' onClick={() => setEditDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type='submit' disabled={editCompany.isPending}>
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
