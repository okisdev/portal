'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationTable } from '@/components/shared/pagination-table';
import { TableLoading } from '@/components/shared/table-loading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
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
import { MoreHorizontal, Pencil, Plus, Trash, Users } from 'lucide-react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type TeamWithCount = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  createdBy: string;
  contacts: number;
};

export default function CRMTeamsPage() {
  const router = useRouter();
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
      toast.success('Team deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
      header: t('team_name'),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Users className='size-4 text-muted-foreground' />
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: t('description'),
    },
    {
      accessorKey: 'contacts',
      header: t('contacts'),
    },
    {
      accessorKey: 'createdAt',
      header: t('created'),
      cell: ({ row }) => formatDate(new Date(row.getValue('createdAt'))),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/crm/team/${row.original.id}?mode=edit`);
              }}
              className='cursor-pointer'
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
    },
  ];

  const table = useReactTable({
    data: teams ?? [],
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

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <PageHeader
          title={t('teams')}
          description={t('teams_description')}
          right={
            <Button variant='outline' className='h-8' disabled>
              <Plus className='mr-2 size-4' /> {t('create_team')}
            </Button>
          }
        />
        <TableLoading columnCount={5} rowCount={5} />
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={t('teams')}
        description={t('teams_description')}
        right={
          <Button variant='outline' className='h-8' onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='mr-2 size-4' /> {t('create_team')}
          </Button>
        }
      />

      <div className='flex items-center py-4'>
        <Input
          placeholder='Filter teams...'
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
          className='h-8 max-w-sm'
        />
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
          searchPlaceholder='Search columns...'
          emptyText='No columns found'
          groupHeading='Available Columns'
          allowCustom={false}
          renderItem={(item) => {
            const column = table.getAllColumns().find((col) => col.id === item);
            return (
              <div className='flex w-full items-center justify-between'>
                <span className='capitalize'>{item}</span>
                {column?.getIsVisible() && <Check className='h-4 w-4' />}
              </div>
            );
          }}
          className='ml-2 w-48'
          size='sm'
          alwaysPlaceHolder={true}
        />
      </div>

      <PaginationTable table={table} columns={tableColumns} loading={isLoading} onRowClick={(row) => router.push(`/dashboard/crm/team/${row.id}`)} rowClassName='cursor-pointer hover:bg-muted' />

      <ActionAlertDialog
        open={!!teamToDelete}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        onConfirm={() => teamToDelete && handleDeleteTeam(teamToDelete)}
        description={t('delete_team_description')}
      />

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{t('create_new_team')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className='space-y-4'>
            <div className='space-y-2'>
              <Label>{t('team_name')}</Label>
              <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder='Enter team name...' />
            </div>
            <div className='space-y-2'>
              <Label>{t('description')}</Label>
              <Input value={newTeamDescription} onChange={(e) => setNewTeamDescription(e.target.value)} placeholder='Enter team description...' />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => setIsCreateModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type='submit' disabled={createTeam.isPending}>
                {t('create_team')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
