'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Building2, Mail, Phone, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';

export default function TeamDetailsPage() {
  const { id: teamId } = useParams<{ id: string }>();

  const { data: team, isLoading } = api.team.getTeamById.useQuery({
    id: teamId[0],
  });

  const { data: contacts } = api.team.getTeamContacts.useQuery({
    teamId: teamId[0],
  });

  const { data: members } = api.team.getTeamMembers.useQuery({
    teamId: teamId[0],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!team) {
    notFound();
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <h1 className='font-semibold text-2xl'>{team.name}</h1>
          <p className='text-gray-500'>{team.description}</p>
        </div>
        <Button variant='outline'>
          <Users className='mr-2 size-4' /> Manage Members
        </Button>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2 space-y-4'>
          <div className='rounded-lg border bg-white'>
            <div className='border-b p-4'>
              <h2 className='font-semibold'>Team Contacts</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts?.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link href={`/dashboard/crm/contacts/${contact.id}`} className='flex items-center gap-2 hover:underline'>
                        <Avatar className='size-8'>
                          <AvatarFallback>{contact.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>{contact.name}</div>
                          <div className='text-gray-500 text-xs'>{contact.email}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {contact.company && (
                        <div className='flex items-center gap-1'>
                          <Building2 className='size-3 text-gray-500' />
                          {contact.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <Link href={`mailto:${contact.email}`} className='flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700'>
                          <Mail className='size-3' />
                          {contact.email}
                        </Link>
                        {contact.phone && (
                          <Link href={`tel:${contact.phone}`} className='flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700'>
                            <Phone className='size-3' />
                            {contact.phone}
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='w-24'>{contact.status}</div>
                    </TableCell>
                    <TableCell>{formatDate(new Date(contact.createdAt))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border bg-white p-4'>
            <h2 className='mb-3 font-semibold'>Team Members</h2>
            <div className='space-y-3'>
              {members?.map((member) => (
                <div key={member.id} className='flex items-center gap-3'>
                  <Avatar className='size-8'>
                    <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='font-medium'>{member.user.name}</div>
                    <div className='text-gray-500 text-xs capitalize'>{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
