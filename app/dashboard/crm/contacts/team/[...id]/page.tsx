'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { CreateEvent } from '@/components/shared/create-event';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';

export default function TeamIdPage() {
  const { id: teamId } = useParams<{ id: string }>();

  const utils = api.useUtils();

  const { data: team, isLoading } = api.team.getTeamById.useQuery({
    id: teamId[0],
  });
  const { data: teamContacts } = api.team.getTeamContacts.useQuery({
    teamId: teamId[0],
  });
  const { data: teamMeetings } = api.team.getTeamMeetings.useQuery({
    teamId: teamId[0],
  });
  const { data: teamRemarks } = api.team.getTeamRemarks.useQuery({
    teamId: teamId[0],
  });
  const { data: contacts } = api.contact.getAllContacts.useQuery(); // For contact selection
  const { data: folders } = api.calendar.getFolders.useQuery();
  const { data: participantOptions } = api.calendar.getParticipantOptions.useQuery();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRemark, setNewRemark] = useState('');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    leaderId: '',
    subLeaderId: '',
    referralId: '',
  });

  const updateTeam = api.team.updateTeam.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      utils.team.getTeamById.invalidate({ id: teamId[0] });
    },
  });

  const createRemark = api.team.createTeamRemark.useMutation({
    onSuccess: () => {
      setNewRemark('');
      utils.team.getTeamRemarks.invalidate({ teamId: teamId[0] });
    },
  });

  const createMeeting = api.team.createTeamMeeting.useMutation({
    onSuccess: () => {
      setIsNewMeetingModalOpen(false);
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getFolders.invalidate();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!team) return notFound();

  const handleEditClick = () => {
    setEditForm({
      name: team.name,
      description: team.description || '',
      leaderId: team.leaderId || '',
      subLeaderId: team.subLeaderId || '',
      referralId: team.referralId || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeam.mutate({
      id: teamId[0],
      ...editForm,
    });
  };

  const handleSubmitRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    createRemark.mutate({
      teamId: teamId[0],
      content: newRemark,
    });
  };

  const handleCreateMeeting = async (data: any) => {
    await createMeeting.mutateAsync({
      teamId: teamId[0],
      title: data.title,
      description: data.description ?? '',
      meetingDate: data.startAt,
    });
  };

  const meetingsFolder = folders?.find((f) => f.name === `Team ${team.name} Meetings`);

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={team.name}
        description={team.description || ''}
        right={
          <Button variant='outline' size='sm' className='h-8' onClick={handleEditClick}>
            <Edit2 className='mr-1 size-4' /> Edit Team
          </Button>
        }
      />

      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2 space-y-4'>
          <div className='rounded-lg border bg-white p-4'>
            <h2 className='mb-4 font-semibold'>Team Members</h2>
            <div className='space-y-3'>
              {teamContacts?.map((member) => (
                <div key={member.id} className='flex items-center justify-between rounded-lg border p-2'>
                  <div className='flex items-center gap-2'>
                    <Avatar className='size-8'>
                      <AvatarFallback>{member.contact.firstName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>
                        {member.contact.firstName} {member.contact.lastName}
                      </p>
                      <p className='text-gray-500 text-sm'>{member.contact.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-lg border bg-white p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-semibold'>Remarks</h2>
              <form onSubmit={handleSubmitRemark} className='flex max-w-md flex-1 gap-2'>
                <Input value={newRemark} onChange={(e) => setNewRemark(e.target.value)} placeholder='Add remark...' className='h-8' />
                <Button type='submit' size='sm' disabled={createRemark.isPending}>
                  Add
                </Button>
              </form>
            </div>
            <div className='space-y-3'>
              {teamRemarks?.map((remark) => (
                <div key={remark.id} className='rounded-lg border p-3'>
                  <p className='text-sm'>{remark.content}</p>
                  <p className='mt-1 text-gray-500 text-xs'>
                    By {remark.createdBy} - {formatDate(new Date(remark.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          {/* Team Info Box */}
          <div className='rounded-lg border bg-white p-4'>
            <h2 className='mb-3 font-semibold'>Team Information</h2>
            <div className='space-y-3'>
              <div>
                <Label className='text-gray-500 text-xs'>Team Leader</Label>
                <p className='text-sm'>
                  {team.leader?.firstName} {team.leader?.lastName}
                </p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Sub Leader</Label>
                <p className='text-sm'>
                  {team.subLeader?.firstName} {team.subLeader?.lastName}
                </p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Referral</Label>
                <p className='text-sm'>
                  {team.referral?.firstName} {team.referral?.lastName}
                </p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Created</Label>
                <p className='text-sm'>{formatDate(new Date(team.createdAt))}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border bg-white p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='font-semibold'>Meetings</h2>
              <Button variant='outline' size='sm' onClick={() => setIsNewMeetingModalOpen(true)}>
                <Calendar className='mr-1 size-4' /> New Meeting
              </Button>
            </div>
            <div className='space-y-3'>
              {teamMeetings?.map((meeting) => (
                <div key={meeting.id} className='flex items-center gap-3 text-sm'>
                  <Calendar className='size-4 text-gray-500' />
                  <div className='flex-1'>
                    <p className='font-medium'>{meeting.title}</p>
                    <p className='text-gray-500 text-xs'>{formatDate(new Date(meeting.meetingDate))}</p>
                  </div>
                  <ColorBadge type='status' value={meeting.status || 'upcoming'} />
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this meeting?')) {
                        deleteTeamMeeting.mutate({
                          id: meeting.id,
                          teamId: teamId[0],
                        });
                      }
                    }}
                  >
                    <Trash2 className='size-4 text-gray-500' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Information</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className='space-y-4'>
            <div className='space-y-2'>
              <Label>Team Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>Team Leader</Label>
              <Select value={editForm.leaderId} onValueChange={(value) => setEditForm({ ...editForm, leaderId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select team leader' />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Sub Leader</Label>
              <Select value={editForm.subLeaderId} onValueChange={(value) => setEditForm({ ...editForm, subLeaderId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select sub leader' />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Referral</Label>
              <Select value={editForm.referralId} onValueChange={(value) => setEditForm({ ...editForm, referralId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select referral' />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end space-x-2'>
              <Button type='button' variant='outline' onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={updateTeam.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateEvent
        open={isNewMeetingModalOpen}
        onOpenChange={setIsNewMeetingModalOpen}
        onSubmit={handleCreateMeeting}
        defaultValues={{
          startAt: new Date(),
          endAt: new Date(Date.now() + 60 * 60 * 1000),
          folderId: meetingsFolder?.id ?? '',
        }}
        folders={folders}
        participantOptions={
          participantOptions && {
            users: participantOptions.users.map((u) => ({ id: u.id, name: u.name || '' })),
            contacts: participantOptions.contacts,
          }
        }
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          });
        }}
      />
    </div>
  );
}
