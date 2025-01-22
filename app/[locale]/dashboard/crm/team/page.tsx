'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { TableLoading } from '@/components/shared/table-loading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash, Users } from 'lucide-react';
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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

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
      header: 'Team Name',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Users className='size-4 text-muted-foreground' />
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'contacts',
      header: 'Contacts',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
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
              Edit team
            </DropdownMenuItem>
            <DropdownMenuItem
              className='cursor-pointer text-destructive'
              onClick={(e) => {
                e.stopPropagation();
                setTeamToDelete(row.original.id);
              }}
            >
              <Trash className='mr-2 h-4 w-4' />
              Delete team
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
          title='Teams'
          description='Manage teams and their contacts.'
          right={
            <Button variant='outline' className='h-8' disabled>
              <Plus className='mr-2 size-4' /> Create Team
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
        title='Teams'
        description='Manage teams and their contacts.'
        right={
          <Button variant='outline' className='h-8' onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='mr-2 size-4' /> Create Team
          </Button>
        }
      />

      <div>
        <div className='flex items-center py-4'>
          <Input
            placeholder='Filter teams...'
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className='max-w-sm'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='ml-auto'>
                Columns <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem key={column.id} className='capitalize' checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} onClick={() => router.push(`/dashboard/crm/team/${row.original.id}`)} className='cursor-pointer hover:bg-muted'>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex-1 text-muted-foreground text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button variant='outline' size='sm' onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <ActionAlertDialog
        open={!!teamToDelete}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        onConfirm={() => teamToDelete && handleDeleteTeam(teamToDelete)}
        description='This action cannot be undone. This will permanently delete the team and remove all associated data.'
      />

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Team Name</Label>
              <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder='Enter team name...' />
            </div>
            <div className='space-y-2'>
              <Label>Description</Label>
              <Input value={newTeamDescription} onChange={(e) => setNewTeamDescription(e.target.value)} placeholder='Enter team description...' />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createTeam.isPending}>
                Create Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
