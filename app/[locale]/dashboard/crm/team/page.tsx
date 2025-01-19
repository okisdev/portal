'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { TableLoading } from '@/components/shared/table-loading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { MoreHorizontal, Pencil, Plus, Trash, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

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
        <div className='rounded-lg border bg-card text-card-foreground'>
          <TableLoading columnCount={4} rowCount={5} />
        </div>
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

      <div className='rounded-lg border bg-card text-card-foreground'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams?.map((team) => (
              <TableRow key={team.id} onClick={() => router.push(`/dashboard/crm/team/${team.id}`)} className='cursor-pointer hover:bg-muted'>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    <Users className='size-4 text-muted-foreground' />
                    {team.name}
                  </div>
                </TableCell>
                <TableCell>{team.description}</TableCell>
                <TableCell>{team.contacts}</TableCell>
                <TableCell>{formatDate(new Date(team.createdAt))}</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/team/${team.id}?mode=edit`);
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
                          setTeamToDelete(team.id);
                        }}
                      >
                        <Trash className='mr-2 h-4 w-4' />
                        Delete team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className='text-right'>
                <p className='text-neutral-500 text-sm'>Total {teams?.length} teams</p>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
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
