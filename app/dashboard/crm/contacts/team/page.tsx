'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TeamPage() {
  const router = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

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

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    createTeam.mutate({
      name: newTeamName,
      description: newTeamDescription,
    });
  };

  if (isLoading) {
    return <PageLoading />;
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

      <div className='rounded-lg border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams?.map((team) => (
              <TableRow key={team.id} onClick={() => router.push(`/dashboard/crm/contacts/team/${team.id}`)} className='cursor-pointer hover:bg-muted/50'>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    <Users className='size-4 text-gray-500' />
                    {team.name}
                  </div>
                </TableCell>
                <TableCell>{team.description}</TableCell>
                <TableCell>{team.contacts}</TableCell>
                <TableCell>{formatDate(new Date(team.createdAt))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
