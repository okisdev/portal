'use client';

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
  MoreHorizontal,
  Pencil,
  Plus,
  Trash,
  Users,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/table';
import { DataTableHeader } from '@/components/shared/table/header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';

type TeamWithCount = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  createdBy: string;
  contacts: number;
  company: { id: string; name: string } | null;
};

export default function CRMTeamsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedColumn, setSelectedColumn] = useState('');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const utils = api.useUtils();
  const { data: teams, isLoading } = api.team.getAllTeams.useQuery();

  const createTeam = api.team.createTeam.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
      utils.team.getAllTeams.invalidate();
    },
  });

  const deleteTeam = api.team.deleteTeam.useMutation({
    onSuccess: () => {
      utils.team.getAllTeams.invalidate();
      toast.success(t('team_deleted_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl, { scroll: false });
  }, [search, pathname]);

  const filteredTeams = useMemo(() => {
    if (!teams) return [];

    return teams.filter((team) => {
      if (debouncedSearch) {
        const searchTerm = debouncedSearch.toLowerCase();
        const name = team.name.toLowerCase();
        const description = (team.description || '').toLowerCase();
        const company = (team.company?.name || '').toLowerCase();

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          company.includes(searchTerm)
        );
      }
      return true;
    });
  }, [teams, debouncedSearch]);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    createTeam.mutate({
      name: newTeamName,
      description: newTeamDescription,
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    deleteTeam.mutate({ id: teamId });
    setTeamToDelete(null);
  };

  const tableColumns: ColumnDef<TeamWithCount>[] = [
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
        <DataTableHeader column={column} title={t('team_name')} />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Users className='size-4 text-muted-foreground' />
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('description')} />
      ),
    },
    {
      accessorKey: 'contacts',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('contacts')} />
      ),
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('company')} />
      ),
      cell: ({ row }) => {
        const { company } = row.original;
        return company ? company.name : '-';
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableHeader column={column} title={t('created')} />
      ),
      cell: ({ row }) => formatDate(new Date(row.getValue('createdAt'))),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button className='h-8 w-8 p-0' variant='ghost'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/crm/team/${row.original.id}?mode=edit`);
              }}
            >
              <Pencil className='mr-2 h-4 w-4' />
              {t('edit_team')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer text-destructive'
              onClick={(e) => {
                e.stopPropagation();
                setTeamToDelete(row.original.id);
              }}
            >
              <Trash className='mr-2 h-4 w-4' />
              {t('delete_team')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: filteredTeams,
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
        description={t('teams_description')}
        subtitle={
          isLoading
            ? undefined
            : `(${t('total_number_teams', { count: filteredTeams.length })})`
        }
        title={t('teams')}
      />

      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Input
            className='h-8 w-72 max-w-sm'
            disabled={isLoading}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filter_teams')}
            value={search}
          />
          <Combobox
            allowCustom={false}
            alwaysPlaceHolder={true}
            className='ml-2 w-48'
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
            onClick={() => setIsCreateModalOpen(true)}
            variant='outline'
          >
            <Plus className='size-4' /> {t('create_team')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={tableColumns}
        loading={isLoading}
        onRowClick={(row) => router.push(`/dashboard/crm/team/${row.id}`)}
        table={table}
      />

      <ActionAlertDialog
        description={t('delete_site_description')}
        onConfirm={() => teamToDelete && handleDeleteTeam(teamToDelete)}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        open={!!teamToDelete}
      />

      <Dialog onOpenChange={setIsCreateModalOpen} open={isCreateModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('create_new_team')}</DialogTitle>
          </DialogHeader>
          <form className='space-y-4' onSubmit={handleCreateTeam}>
            <div className='space-y-2'>
              <Label>{t('team_name')}</Label>
              <Input
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder='Enter team name...'
                value={newTeamName}
              />
            </div>
            <div className='space-y-2'>
              <Label>{t('description')}</Label>
              <Input
                onChange={(e) => setNewTeamDescription(e.target.value)}
                placeholder={t('enter_team_description')}
                value={newTeamDescription}
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                type='button'
                variant='outline'
              >
                {t('cancel')}
              </Button>
              <Button disabled={createTeam.isPending} type='submit'>
                {t('create_team')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
