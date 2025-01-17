'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { Combobox } from '@/components/shared/combobox';
import { ComboboxCommand } from '@/components/shared/combobox';
import { EventDialog } from '@/components/shared/event-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {} from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Calendar, Edit2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
    campaignCode: '',
  });
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const updateTeam = api.team.updateTeam.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      utils.team.getTeamById.invalidate({ id: teamId[0] });
      toast.success('Team updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createRemark = api.team.createTeamRemark.useMutation({
    onSuccess: () => {
      setNewRemark('');
      utils.team.getTeamRemarks.invalidate({ teamId: teamId[0] });
      toast.success('Remark created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMeeting = api.team.createTeamMeeting.useMutation({
    onSuccess: () => {
      setIsNewMeetingModalOpen(false);
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
      toast.success('Meeting created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: teamId[0] });
      toast.success('Meeting deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getFolders.invalidate();
      toast.success('Folder created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addTeamMember = api.team.addTeamMember.useMutation({
    onSuccess: () => {
      setIsAddMemberOpen(false);
      utils.team.getTeamContacts.invalidate({ teamId: teamId[0] });
      toast.success('Member added successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddMember = (contactId: string) => {
    addTeamMember.mutate({
      teamId: teamId[0],
      contactId,
    });
  };

  if (isLoading) return <PageLoading />;

  if (!team) return notFound();

  const handleEditClick = () => {
    setEditForm({
      name: team.name,
      description: team.description || '',
      leaderId: team.leaderId || '',
      subLeaderId: team.subLeaderId || '',
      referralId: team.referralId || '',
      campaignCode: team.campaignCode || '',
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

  const initialParticipants =
    teamContacts?.map((member) => ({
      type: 'contact' as const,
      id: member.contact.id,
      name: `${member.contact.firstName} ${member.contact.lastName}`,
      role: 'required' as const,
    })) || [];

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
          <div className='space-y-2 rounded-lg border bg-white p-4'>
            <div className='flex items-center justify-between'>
              <p className='font-semibold'>Team Members</p>
              <Popover open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' size='sm' className='h-8'>
                    <Plus className='mr-1 size-4' /> Add Member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[300px] p-0' align='end'>
                  <ComboboxCommand
                    query={searchValue}
                    setQuery={setSearchValue}
                    value=''
                    onChange={handleAddMember}
                    setOpen={setIsAddMemberOpen}
                    items={
                      contacts
                        ?.filter(
                          (contact) =>
                            !teamContacts?.some((member) => member.contact.id === contact.id) &&
                            (contact.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
                              contact.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
                              contact.email.toLowerCase().includes(searchValue.toLowerCase()))
                        )
                        .map((contact) => contact.id) ?? []
                    }
                    searchPlaceholder='Search contacts...'
                    emptyText='No contacts found.'
                    groupHeading='Contacts'
                    allowCustom={false}
                    renderItem={(contactId) => {
                      const contact = contacts?.find((c) => c.id === contactId);
                      if (!contact) return null;
                      return (
                        <>
                          <Avatar className='size-6'>
                            <AvatarFallback>{contact.firstName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <p className='text-sm'>
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className='text-gray-500 text-xs'>{contact.email}</p>
                          </div>
                        </>
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {teamContacts && teamContacts?.length > 0 && (
              <div className='space-y-3'>
                {teamContacts?.map((member) => (
                  <Link key={member.id} href={`/dashboard/crm/contacts/${member.contact.id}`} className='flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-gray-50'>
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
                  </Link>
                ))}
              </div>
            )}
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
          <div className='rounded-lg border bg-white p-4'>
            <h2 className='mb-3 font-semibold'>Team Information</h2>
            <div className='space-y-3'>
              <div>
                <Label className='text-gray-500 text-xs'>Team Leader</Label>
                <p className='text-sm'>
                  <Link href={`/dashboard/crm/contacts/${team.leaderId}`}>{team.leaderId ? `${team.leader?.firstName} ${team.leader?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Sub Leader</Label>
                <p className='text-sm'>
                  <Link href={`/dashboard/crm/contacts/${team.subLeaderId}`}>{team.subLeaderId ? `${team.subLeader?.firstName} ${team.subLeader?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Referral</Label>
                <p className='text-sm'>
                  <Link href={`/dashboard/crm/contacts/${team.referralId}`}>{team.referralId ? `${team.referral?.firstName} ${team.referral?.lastName}` : 'N/A'}</Link>
                </p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Campaign Code</Label>
                <p className='text-sm'>{team.campaignCode || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-gray-500 text-xs'>Created</Label>
                <p className='text-sm'>{formatDate(new Date(team.createdAt))}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border bg-white p-4'>
            <div className='flex items-center justify-between'>
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
                    <p className='text-gray-500 text-xs'>
                      {formatDate(new Date(meeting.meetingDate))}
                      {meeting.status === 'completed' && ' (Past)'}
                    </p>
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
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
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
              <Combobox
                value={
                  editForm.leaderId
                    ? `${teamContacts?.find((m) => m.contact.id === editForm.leaderId)?.contact.firstName} ${teamContacts?.find((m) => m.contact.id === editForm.leaderId)?.contact.lastName}`
                    : ''
                }
                onChange={(value) => {
                  const member = teamContacts?.find((m) => `${m.contact.firstName} ${m.contact.lastName}` === value);
                  setEditForm({ ...editForm, leaderId: member?.contact.id || '' });
                }}
                items={teamContacts?.map((member) => `${member.contact.firstName} ${member.contact.lastName}`) || []}
                placeholder='Select team leader'
                searchPlaceholder='Search team leader...'
                allowCustom={false}
                groupHeading='Contacts'
              />
            </div>
            <div className='space-y-2'>
              <Label>Sub Leader</Label>
              <Combobox
                value={
                  editForm.subLeaderId
                    ? `${teamContacts?.find((m) => m.contact.id === editForm.subLeaderId)?.contact.firstName} ${teamContacts?.find((m) => m.contact.id === editForm.subLeaderId)?.contact.lastName}`
                    : ''
                }
                onChange={(value) => {
                  const member = teamContacts?.find((m) => `${m.contact.firstName} ${m.contact.lastName}` === value);
                  setEditForm({ ...editForm, subLeaderId: member?.contact.id || '' });
                }}
                items={teamContacts?.map((member) => `${member.contact.firstName} ${member.contact.lastName}`) || []}
                placeholder='Select sub leader'
                searchPlaceholder='Search sub leader...'
                allowCustom={false}
                groupHeading='Contacts'
              />
            </div>
            <div className='space-y-2'>
              <Label>Referral</Label>
              <Combobox
                value={
                  editForm.referralId
                    ? `${contacts?.find((c) => c.id === editForm.referralId)?.firstName} ${contacts?.find((c) => c.id === editForm.referralId)?.lastName} (${
                        contacts?.find((c) => c.id === editForm.referralId)?.email
                      })`
                    : ''
                }
                onChange={(value) => {
                  const contact = contacts?.find((c) => `${c.firstName} ${c.lastName} (${c.email})` === value);
                  setEditForm({ ...editForm, referralId: contact?.id || '' });
                }}
                items={contacts?.map((contact) => `${contact.firstName} ${contact.lastName} (${contact.email})`) || []}
                placeholder='Select referral'
                searchPlaceholder='Search referral...'
                allowCustom={false}
                groupHeading='Contacts'
              />
            </div>
            <div className='space-y-2'>
              <Label>Campaign Code</Label>
              <Input value={editForm.campaignCode} onChange={(e) => setEditForm({ ...editForm, campaignCode: e.target.value })} placeholder='Enter campaign code' />
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

      <EventDialog
        open={isNewMeetingModalOpen}
        onOpenChange={setIsNewMeetingModalOpen}
        onSubmit={handleCreateMeeting}
        folders={folders}
        participantOptions={
          participantOptions && {
            users: participantOptions.users.map((u) => ({ id: u.id, name: u.name || '' })),
            contacts: participantOptions.contacts,
          }
        }
        initialParticipants={initialParticipants}
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
