'use client';

import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timezones } from '@/data/data';
import type { Timezone } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { BadgeX, Check, Pencil, Verified } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function AccountSettingsPage() {
  const t = useTranslations();

  const { data: me, isLoading } = api.account.getMeFromDatabase.useQuery();

  const updateAccount = api.account.updateMe.useMutation();
  const updatePassword = api.account.updatePassword.useMutation();
  const updateTimezone = api.account.updateTimezone.useMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [timezone, setTimezone] = useState<Timezone>('Asia/Hong_Kong');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [confirmPendingEmail, setConfirmPendingEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (me) {
      setFirstName(me.firstName ?? '');
      setLastName(me.lastName ?? '');
      setEmail(me.email ?? '');
      setImage(me.image ?? '');
      setTimezone((me.timezone as Timezone) ?? 'Asia/Hong_Kong');
    }
  }, [me]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
  };

  const handleNameChange = async (field: 'firstName' | 'lastName', value: string) => {
    const updateData = field === 'firstName' ? { firstName: value } : { lastName: value };
    try {
      await updateAccount.mutateAsync(updateData, {
        onSuccess: () => {
          toast.success(t('account_updated_successfully'));
        },
        onError: () => {
          toast.error(t('failed_to_update_account'));
        },
      });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleEmailEditClick = () => {
    setPendingEmail(email);
    setConfirmPendingEmail('');
    setEmailError('');
    setIsEmailDialogOpen(true);
  };

  const confirmEmailChange = async () => {
    if (pendingEmail !== confirmPendingEmail) {
      setEmailError(t('emails_do_not_match'));
      return;
    }

    try {
      await updateAccount.mutateAsync(
        {
          email: pendingEmail,
        },
        {
          onSuccess: () => {
            setEmail(pendingEmail);
            setIsEmailDialogOpen(false);
            setEmailError('');
            toast.success(t('account_updated_successfully'));
          },
          onError: () => {
            toast.error(t('failed_to_update_account'));
          },
        }
      );
    } catch (error) {
      console.error('Failed to update email:', error);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    try {
      await updatePassword.mutateAsync(
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          onSuccess: () => {
            toast.success(t('password_updated_successfully'));
          },
          onError: () => {
            toast.error(t('failed_to_update_password'));
          },
        }
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  };

  const handleTimezoneChange = async (value: Timezone) => {
    try {
      await updateTimezone.mutateAsync(
        { timezone: value },
        {
          onSuccess: () => {
            setTimezone(value);
            toast.success(t('timezone_updated_successfully'));
          },
          onError: () => {
            toast.error(t('failed_to_update_timezone'));
          },
        }
      );
    } catch (error) {
      console.error('Failed to update timezone:', error);
    }
  };

  return (
    <div className='container mx-auto max-w-4xl space-y-4 px-4 pt-10'>
      <PageHeader title={t('account_settings')} description={t('account_settings_description')} />

      <div className='flex h-full flex-col space-y-8'>
        <Tabs defaultValue='profile' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='profile'>{t('profile')}</TabsTrigger>
            <TabsTrigger value='password'>{t('password')}</TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-4'>
            <div className='space-y-8'>
              <div className='flex items-center space-x-8'>
                <Avatar className='h-28 w-28'>
                  <AvatarImage src={image || '/default-avatar.png'} alt='Profile picture' />
                  <AvatarFallback>
                    {firstName?.[0]}
                    {lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-2'>
                  <h2 className='font-medium text-xl tracking-tight'>{t('profile_picture')}</h2>
                  <p className='text-muted-foreground text-sm'>{t('update_your_profile_picture')}</p>
                  <Button type='button' variant='outline' onClick={() => fileInputRef.current?.click()}>
                    {t('change_photo')}
                  </Button>
                  <Input type='file' ref={fileInputRef} onChange={handleImageUpload} accept='image/*' className='hidden' />
                </div>
              </div>

              <div className='space-y-4'>
                <h2 className='font-medium text-xl tracking-tight'>{t('personal_information')}</h2>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>{t('first_name')}</Label>
                    <Input
                      type='text'
                      id='firstName'
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        handleNameChange('firstName', e.target.value);
                      }}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>{t('last_name')}</Label>
                    <Input
                      type='text'
                      id='lastName'
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        handleNameChange('lastName', e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='flex items-center gap-2'>
                    {t('email_address')}
                    {!isLoading && (me?.emailVerified ? <Verified className='h-4 w-4 text-green-500' /> : <BadgeX className='h-4 w-4 text-red-500' />)}
                  </Label>
                  <div className='flex items-center gap-2'>
                    <Input type='email' id='email' value={email} readOnly className='cursor-default' />
                    <Button variant='outline' size='icon' onClick={handleEmailEditClick} className='shrink-0'>
                      <Pencil className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h2 className='font-medium text-xl tracking-tight'>{t('preferences')}</h2>

                <div className='space-y-2'>
                  <Label htmlFor='timezone'>{t('timezone')}</Label>
                  <Combobox
                    value={timezone}
                    onChange={(value) => handleTimezoneChange(value as Timezone)}
                    items={timezones.map((tz) => tz.value)}
                    placeholder={t('select_timezone')}
                    searchPlaceholder={t('search_timezone')}
                    emptyText={t('no_timezone_found')}
                    groupHeading={t('timezones')}
                    allowCustom={false}
                    renderItem={(item) => (
                      <div className='flex w-full items-center justify-between'>
                        <span>{`${timezones.find((tz) => tz.value === item)?.value} (${timezones.find((tz) => tz.value === item)?.code})` || item}</span>
                        {timezone === item && <Check className='h-4 w-4' />}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='password' className='space-y-4'>
            <div className='space-y-4'>
              <h2 className='font-medium text-2xl tracking-tight'>{t('change_password')}</h2>
              <form onSubmit={handlePasswordSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>{t('current_password')}</Label>
                  <Input type='password' id='currentPassword' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>{t('new_password')}</Label>
                  <Input type='password' id='newPassword' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>{t('confirm_new_password')}</Label>
                  <Input type='password' id='confirmPassword' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className='flex justify-end'>
                  <Button type='submit' disabled={updatePassword.isPending}>
                    {updatePassword.isPending ? t('updating_password') : t('update_password')}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={isEmailDialogOpen}
        onOpenChange={(open) => {
          setIsEmailDialogOpen(open);
          if (!open) {
            setEmailError('');
            setPendingEmail('');
            setConfirmPendingEmail('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('update_email_address')}</DialogTitle>
            <DialogDescription>{t('update_email_address_description')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='newEmail'>{t('new_email')}</Label>
              <Input id='newEmail' type='email' value={pendingEmail} onChange={(e) => setPendingEmail(e.target.value)} placeholder={t('enter_new_email')} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmEmail'>{t('confirm_new_email')}</Label>
              <Input id='confirmEmail' type='email' value={confirmPendingEmail} onChange={(e) => setConfirmPendingEmail(e.target.value)} placeholder={t('confirm_new_email')} />
            </div>
            {emailError && <p className='text-destructive text-sm'>{emailError}</p>}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEmailDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={confirmEmailChange} disabled={updateAccount.isPending || !pendingEmail || !confirmPendingEmail}>
              {updateAccount.isPending ? t('updating') : t('update_email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
