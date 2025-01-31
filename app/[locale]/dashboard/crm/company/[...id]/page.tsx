'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { EventDialog } from '@/components/shared/event-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoading } from '@/components/shared/page-loading';
import { PhoneInput } from '@/components/shared/phone-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

export default function CompanyIdPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const t = useTranslations();

  const utils = api.useUtils();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const editCompanyForm = useForm<CreateCompanySchema>({
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

  const { data: company, isLoading } = api.company.getCompanyById.useQuery({
    id: companyId[0],
  });
  const { data: teams } = api.company.getCompanyTeams.useQuery({
    companyId: companyId[0],
  });
  const { data: folders } = api.calendar.getMyFolders.useQuery();
  const { data: participantOptions } = api.calendar.getParticipantOptions.useQuery(undefined, {
    enabled: isNewMeetingModalOpen,
  });

  const updateCompany = api.company.updateCompany.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/crm/company/${companyId[0]}`);
      utils.company.getCompanyById.invalidate({ id: companyId[0] });
      toast.success(t('company_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMeeting = api.team.createTeamMeeting.useMutation({
    onSuccess: () => {
      setIsNewMeetingModalOpen(false);
      utils.team.getTeamMeetings.invalidate({ teamId: companyId[0] });
      toast.success('Meeting created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: companyId[0] });
      toast.success('Meeting deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getMyFolders.invalidate();
      toast.success('Folder created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeCompanyContact = api.company.removeCompanyContact.useMutation({
    onSuccess: () => {
      setContactToDelete(null);
      utils.company.getCompanyContacts.invalidate({ companyId: companyId[0] });
      toast.success(t('contact_removed_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (mode === 'edit' && company) {
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
        status: company.status || 'active',
      });
      setIsEditModalOpen(true);
    } else {
      setIsEditModalOpen(false);
    }
  }, [mode, company]);

  if (isLoading) return <PageLoading />;

  if (!company) return notFound();

  const handleEditClick = () => {
    router.push(`/dashboard/crm/company/${companyId[0]}?mode=edit`);
  };

  const handleCloseEdit = () => {
    router.push(`/dashboard/crm/company/${companyId[0]}`);
  };

  const handleSubmitEdit = editCompanyForm.handleSubmit((data) => {
    updateCompany.mutate({
      id: companyId[0],
      ...data,
    });
  });

  const handleCreateMeeting = async (data: any) => {
    await createMeeting.mutateAsync({
      teamId: companyId[0],
      title: data.title,
      description: data.description ?? '',
      meetingDate: data.startAt,
    });
  };

  const handleDeleteContact = () => {
    if (contactToDelete) {
      removeCompanyContact.mutate({
        companyId: companyId[0],
        contactId: contactToDelete,
      });
    }
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader
        title={company.name}
        description={company.description || ''}
        right={
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='h-8' onClick={handleEditClick}>
              <Edit2 className='mr-1 size-4' /> {t('edit_company')}
            </Button>
          </div>
        }
      />

      <div className='grid grid-cols-3 gap-4'>
        <div className='col-span-2 space-y-4'>
          <div className='rounded-lg border bg-card p-4'>
            <div className='flex items-center justify-between'>
              <p className='font-medium'>{t('company_teams')}</p>
              <Button variant='outline' size='sm' className='h-8' onClick={() => router.push(`/dashboard/crm/team/new?companyId=${companyId[0]}`)}>
                <Plus className='mr-1 size-4' /> {t('add_team')}
              </Button>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {teams && teams?.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_company_teams_found')}</p>}
              {teams?.map((team) => (
                <Link key={team.id} href={`/dashboard/crm/team/${team.id}`} className='rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='font-medium'>{team.name}</p>
                      <p className='text-muted-foreground text-sm'>{team.description || 'N/A'}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex items-center gap-1'>
                        <Users className='size-4' />
                        <span className='text-sm'>{team.contacts}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-medium'>{t('company_information')}</h2>
            <div className='space-y-1'>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('industry')}</Label>
                <p className='text-sm'>{company.industry || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('size')}</Label>
                <p className='text-sm'>{company.size || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('website')}</Label>
                <p className='text-sm'>
                  {(company.website && (
                    <Link href={company.website} target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                      {company.website}
                    </Link>
                  )) ||
                    'N/A'}
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('email')}</Label>
                <p className='text-sm'>{company.email || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('phone')}</Label>
                <p className='text-sm'>{company.phone || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('address')}</Label>
                <p className='text-sm'>{[company.address, company.city, company.state, company.country, company.postalCode].filter(Boolean).join(', ') || 'N/A'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-xs'>{t('status')}</Label>
                <p className='text-sm'>
                  <ColorBadge type='status' value={company.status || ''} />
                </p>
              </div>
              <div className='items-cen flex justify-end'>
                <p className='text-muted-foreground text-xs'>{t('created_on', { date: formatDate(new Date(company.createdAt)) })}</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border bg-card p-4'>
            <h2 className='mb-3 font-medium'>{t('company_stats')}</h2>
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-lg border bg-background p-4'>
                <div className='flex items-center gap-2'>
                  <Users className='size-5' />
                  <p className='font-medium text-sm'>{t('contacts')}</p>
                </div>
                <p className='mt-2 font-bold text-2xl'>{company.contactCount}</p>
              </div>
              <div className='rounded-lg border bg-background p-4'>
                <div className='flex items-center gap-2'>
                  <Users className='size-5' />
                  <p className='font-medium text-sm'>{t('teams')}</p>
                </div>
                <p className='mt-2 font-bold text-2xl'>{company.teamCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>{t('edit_company')}</DialogTitle>
            <DialogDescription>{t('edit_company_description')}</DialogDescription>
          </DialogHeader>
          <Form {...editCompanyForm}>
            <form onSubmit={handleSubmitEdit} className='space-y-4'>
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
                <Button variant='outline' type='button' onClick={handleCloseEdit}>
                  {t('cancel')}
                </Button>
                <Button type='submit' disabled={updateCompany.isPending}>
                  {t('save_changes')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          });
        }}
      />

      <ActionAlertDialog
        open={!!meetingToDelete}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
        onConfirm={() => {
          if (meetingToDelete) {
            deleteTeamMeeting.mutate({
              id: meetingToDelete,
              teamId: companyId[0],
            });
            setMeetingToDelete(null);
          }
        }}
        title={t('delete_meeting')}
        description={t('delete_meeting_description')}
      />

      <ActionAlertDialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        onConfirm={handleDeleteContact}
        title={t('remove_contact')}
        description={t('remove_contact_description')}
      />
    </div>
  );
}
