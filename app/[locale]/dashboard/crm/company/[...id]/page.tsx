'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { EventDialog } from '@/components/shared/event-dialog';
import { PageLoading } from '@/components/shared/page-loading';
import { PhoneInput } from '@/components/shared/phone-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';

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
  email: z.email('Please input a valid email').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

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

  const editCompanyForm = useForm({
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
  const { data: participantOptions } =
    api.calendar.getParticipantOptions.useQuery(undefined, {
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
      toast.success(t('meeting_created_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeamMeeting = api.team.deleteTeamMeeting.useMutation({
    onSuccess: () => {
      utils.team.getTeamMeetings.invalidate({ teamId: companyId[0] });
      toast.success(t('meeting_deleted_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getMyFolders.invalidate();
      toast.success(t('folder_created_successfully'));
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

  if (isLoading) {
    return <PageLoading />;
  }

  if (!company) {
    return notFound();
  }

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
    <div className='h-full min-h-0 w-full flex-1'>
      <div className='flex h-full flex-col lg:flex-row'>
        <div className='w-full lg:w-2/3'>
          <div className='flex h-full flex-col text-card-foreground'>
            <div className='flex-none border-b p-4 md:p-6'>
              <div
                className={cn(
                  company.description
                    ? 'flex items-start justify-between'
                    : 'flex items-center justify-between'
                )}
              >
                <div>
                  <h1 className='font-semibold text-xl'>{company.name}</h1>
                  {company.description && (
                    <p className='text-muted-foreground text-sm'>
                      {company.description}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    className='h-8'
                    onClick={handleEditClick}
                    size='sm'
                    variant='outline'
                  >
                    <Edit2 className='mr-1 size-4' /> {t('edit_company')}
                  </Button>
                </div>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='border-b p-4 sm:p-6'>
                <div className='flex items-center justify-between'>
                  <p className='font-medium'>{t('company_teams')}</p>
                  <Button
                    className='h-8'
                    onClick={() =>
                      router.push(
                        `/dashboard/crm/team/new?companyId=${companyId[0]}`
                      )
                    }
                    size='sm'
                    variant='outline'
                  >
                    <Plus className='mr-1 size-4' /> {t('add_team')}
                  </Button>
                </div>
                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {teams && teams?.length === 0 && (
                    <p className='text-muted-foreground text-sm'>
                      {t('no_company_teams_found')}
                    </p>
                  )}
                  {teams?.map((team) => (
                    <Link
                      className='rounded-lg bg-card p-4 transition-colors hover:bg-muted/50'
                      href={`/dashboard/crm/team/${team.id}`}
                      key={team.id}
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium'>{team.name}</p>
                          <p className='text-muted-foreground text-sm'>
                            {team.description || 'N/A'}
                          </p>
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
          </div>
        </div>

        <div className='w-full lg:w-1/3'>
          <div className='h-full overflow-y-auto border-l bg-card p-3'>
            <div className='space-y-6'>
              <div>
                <h2 className='mb-4 font-medium'>{t('company_information')}</h2>
                <div className='space-y-4'>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('industry')}
                    </Label>
                    <p className='text-sm'>{company.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('size')}
                    </Label>
                    <p className='text-sm'>{company.size || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('website')}
                    </Label>
                    <p className='text-sm'>
                      {(company.website && (
                        <Link
                          className='text-primary hover:underline'
                          href={company.website}
                          rel='noopener noreferrer'
                          target='_blank'
                        >
                          {company.website}
                        </Link>
                      )) ||
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('email')}
                    </Label>
                    <p className='text-sm'>{company.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('phone')}
                    </Label>
                    <p className='text-sm'>{company.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('address')}
                    </Label>
                    <p className='text-sm'>
                      {[
                        company.address,
                        company.city,
                        company.state,
                        company.country,
                        company.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className='text-muted-foreground text-xs'>
                      {t('status')}
                    </Label>
                    <p className='text-sm'>
                      <ColorBadge
                        type='companyStatus'
                        value={company.status || ''}
                      />
                    </p>
                  </div>
                  <div className='flex justify-end'>
                    <p className='text-muted-foreground text-xs'>
                      {t('created_on', {
                        date: formatDate(new Date(company.createdAt)),
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className='mb-4 font-medium'>{t('company_stats')}</h2>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='rounded-lg border bg-background p-4'>
                    <div className='flex items-center gap-2'>
                      <Users className='size-5' />
                      <p className='font-medium text-sm'>{t('contacts')}</p>
                    </div>
                    <p className='mt-2 font-bold text-2xl'>
                      {company.contactCount}
                    </p>
                  </div>
                  <div className='rounded-lg border bg-background p-4'>
                    <div className='flex items-center gap-2'>
                      <Users className='size-5' />
                      <p className='font-medium text-sm'>{t('teams')}</p>
                    </div>
                    <p className='mt-2 font-bold text-2xl'>
                      {company.teamCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => !open && handleCloseEdit()}
        open={isEditModalOpen}
      >
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>{t('edit_company')}</DialogTitle>
            <DialogDescription>
              {t('edit_company_description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editCompanyForm}>
            <form className='space-y-4' onSubmit={handleSubmitEdit}>
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
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_status')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='active'>{t('active')}</SelectItem>
                          <SelectItem value='inactive'>
                            {t('inactive')}
                          </SelectItem>
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
                      <PhoneInput
                        onChange={field.onChange}
                        value={field.value || ''}
                      />
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
                <Button
                  onClick={handleCloseEdit}
                  type='button'
                  variant='outline'
                >
                  {t('cancel')}
                </Button>
                <Button disabled={updateCompany.isPending} type='submit'>
                  {t('save_changes')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <EventDialog
        folders={folders}
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16_777_215).toString(16)}`,
          });
        }}
        onOpenChange={setIsNewMeetingModalOpen}
        onSubmit={handleCreateMeeting}
        open={isNewMeetingModalOpen}
        participantOptions={
          participantOptions && {
            users: participantOptions.users.map((u) => ({
              id: u.id,
              name: u.name || '',
            })),
            contacts: participantOptions.contacts,
          }
        }
      />

      <ActionAlertDialog
        description={t('delete_meeting_description')}
        onConfirm={() => {
          if (meetingToDelete) {
            deleteTeamMeeting.mutate({
              id: meetingToDelete,
              teamId: companyId[0],
            });
            setMeetingToDelete(null);
          }
        }}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
        open={!!meetingToDelete}
        title={t('delete_meeting')}
      />

      <ActionAlertDialog
        description={t('remove_contact_description')}
        onConfirm={handleDeleteContact}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        open={!!contactToDelete}
        title={t('remove_contact')}
      />
    </div>
  );
}
