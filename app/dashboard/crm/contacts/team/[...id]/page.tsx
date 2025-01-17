'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Building2, Mail, MoreVertical, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';

export default function TeamDetailsPage() {
  const router = useRouter();

  const { id: teamId } = useParams<{ id: string }>();

  const { data: team, isLoading } = api.team.getTeamById.useQuery({
    id: teamId[0],
  });

  const { data: contacts } = api.team.getTeamContacts.useQuery({
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
      <PageHeader title={team.name} description={team.description || undefined} />

      <div className='w-full'>
        <div className='space-y-4'>
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
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts?.map((contact) => (
                  <TableRow key={contact.id} className='cursor-pointer hover:bg-muted/50'>
                    <TableCell className='flex items-center gap-2' onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                      <Avatar className='size-8'>
                        <AvatarFallback>{contact.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>{contact.name}</div>
                        <div className='text-gray-500 text-xs'>{contact.email}</div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                      {contact.company && (
                        <div className='flex items-center gap-1'>
                          <Building2 className='size-3 text-gray-500' />
                          {contact.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                      <div className='space-y-1'>
                        <Link href={`mailto:${contact.email}`} className='flex items-center gap-1 text-gray-500 text-xs hover:text-gray-700'>
                          <Mail className='size-3' />
                          {contact.email}
                        </Link>
                        {contact.phone && (
                          <Link href={`tel:${contact.phone}`} className='flex items-center gap-1 text-gray-500 text-xs hover:text-gray-700'>
                            <Phone className='size-3' />
                            {contact.phone}
                          </Link>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>
                      <div className='w-24'>{contact.status}</div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}>{formatDate(new Date(contact.createdAt))}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem className='text-destructive'>Remove from team</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
