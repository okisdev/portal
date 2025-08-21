'use client';

import { BadgeX, Check, Pencil, Verified } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { timezones } from '@/data/data';
import { authClient, signOut } from '@/lib/auth.client';
import type { Timezone } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { setPasswordAction } from './actions';

const USERNAME_REGEX = /^[a-z0-9_-]+$/;

export default function AccountSettingsPage() {
  const t = useTranslations();

  const { data: me, isLoading } = api.account.getMeFromDatabase.useQuery();

  const updateAccount = api.account.updateMe.useMutation();
  const updateTimezone = api.account.updateTimezone.useMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [timezone, setTimezone] = useState<Timezone>('Asia/Hong_Kong');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [confirmPendingEmail, setConfirmPendingEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showLogoutConfirmDialog, setShowLogoutConfirmDialog] = useState(false);

  useEffect(() => {
    if (me) {
      setFirstName(me.firstName ?? '');
      setLastName(me.lastName ?? '');
      setEmail(me.email ?? '');
      setImage(me.image ?? '');
      setUsername(me.username ?? '');
      setTimezone((me.timezone as Timezone) ?? 'Asia/Hong_Kong');
      setHasPassword(me.hasPassword ?? false);
    }
  }, [me]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
  };

  const handleNameChange = async (
    field: 'firstName' | 'lastName',
    value: string
  ) => {
    // Check if value has actually changed
    if (
      (field === 'firstName' && value === me?.firstName) ||
      (field === 'lastName' && value === me?.lastName)
    ) {
      return;
    }

    const updateData =
      field === 'firstName' ? { firstName: value } : { lastName: value };
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

    // Check if email has actually changed
    if (pendingEmail === me?.email) {
      setIsEmailDialogOpen(false);
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

    // For users with password, check all fields; for users without password, only check new password fields
    if (hasPassword) {
      if (!(currentPassword && newPassword && confirmPassword)) {
        return;
      }
    } else if (!(newPassword && confirmPassword)) {
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('passwords_do_not_match'));
      return;
    }

    setIsPasswordLoading(true);

    try {
      if (hasPassword) {
        // User has existing password - use changePassword
        await authClient.changePassword(
          {
            currentPassword,
            newPassword,
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
      } else {
        // User doesn't have password - use setPassword server action
        const result = await setPasswordAction(newPassword);

        if (result.success) {
          toast.success(t('password_created_successfully'));
          setHasPassword(true); // User now has a password
        } else {
          toast.error(result.error || t('failed_to_create_password'));
        }
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to handle password operation:', error);
      toast.error(t('unexpected_error'));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleTimezoneChange = async (value: Timezone) => {
    // Check if timezone has actually changed
    if (value === me?.timezone) {
      return;
    }

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

  const handleUsernameChange = async (value: string) => {
    // Clear previous error
    setUsernameError('');

    // Check if username has actually changed
    if (value === me?.username) {
      return;
    }

    // Validate username format
    if (!USERNAME_REGEX.test(value)) {
      setUsernameError(t('username_format_error'));
      return;
    }

    try {
      await updateAccount.mutateAsync(
        { username: value },
        {
          onSuccess: () => {
            toast.success(t('account_updated_successfully'));
          },
          onError: (error) => {
            if (error.message === 'Username already exists') {
              setUsernameError(t('username_already_exists'));
            } else {
              toast.error(t('failed_to_update_account'));
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to update username:', error);
    }
  };

  const handleForgotPassword = () => {
    setShowLogoutConfirmDialog(true);
  };

  const confirmForgotPassword = async () => {
    if (!me?.email) {
      toast.error(t('no_email_found'));
      return;
    }

    try {
      await authClient.forgetPassword({
        email: me.email,
        redirectTo: `${window.location.origin}/reset-password?email=${me.email}`,
        fetchOptions: {
          onSuccess: async () => {
            toast.success(t('password_reset_email_sent'));

            await signOut();
          },
          onError: () => {
            toast.error(t('failed_to_send_reset_email'));
          },
        },
      });

      toast.success(t('password_reset_email_sent'));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('failed_to_send_reset_email');
      toast.error(errorMessage);
    } finally {
      setShowLogoutConfirmDialog(false);
    }
  };

  return (
    <div className='container mx-auto max-w-4xl space-y-4 px-4 pt-10'>
      <PageHeader
        description={t('account_settings_description')}
        title={t('account_settings')}
      />

      <div className='flex h-full flex-col space-y-8'>
        <Tabs className='space-y-4' defaultValue='profile'>
          <TabsList>
            <TabsTrigger value='profile'>{t('profile')}</TabsTrigger>
            <TabsTrigger value='password'>{t('password')}</TabsTrigger>
          </TabsList>

          <TabsContent className='space-y-4' value='profile'>
            <div className='space-y-8'>
              <div className='flex items-center space-x-8'>
                <Avatar className='h-28 w-28'>
                  <AvatarImage
                    alt='Profile picture'
                    src={image || '/default-avatar.png'}
                  />
                  <AvatarFallback>
                    {firstName?.[0]}
                    {lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-2'>
                  <h2 className='font-medium text-xl tracking-tight'>
                    {t('profile_picture')}
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    {t('update_your_profile_picture')}
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    type='button'
                    variant='outline'
                  >
                    {t('change_photo')}
                  </Button>
                  <Input
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    type='file'
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <h2 className='font-medium text-xl tracking-tight'>
                  {t('personal_information')}
                </h2>
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>{t('first_name')}</Label>
                    <Input
                      id='firstName'
                      onBlur={(e) =>
                        handleNameChange('firstName', e.target.value)
                      }
                      onChange={(e) => setFirstName(e.target.value)}
                      type='text'
                      value={firstName}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>{t('last_name')}</Label>
                    <Input
                      id='lastName'
                      onBlur={(e) =>
                        handleNameChange('lastName', e.target.value)
                      }
                      onChange={(e) => setLastName(e.target.value)}
                      type='text'
                      value={lastName}
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='username'>{t('username')}</Label>
                  <Input
                    id='username'
                    onBlur={(e) => handleUsernameChange(e.target.value)}
                    onChange={(e) => {
                      const lowercaseValue = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '');
                      setUsername(lowercaseValue);
                    }}
                    placeholder={t('enter_username')}
                    type='text'
                    value={username}
                  />
                  {usernameError && (
                    <p className='text-destructive text-sm'>{usernameError}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label className='flex items-center gap-2' htmlFor='email'>
                    {t('email_address')}
                    {!isLoading && (
                      <Tooltip>
                        <TooltipTrigger>
                          {me?.emailVerified ? (
                            <Verified className='h-4 w-4 text-green-500' />
                          ) : (
                            <BadgeX className='h-4 w-4 text-red-500' />
                          )}
                        </TooltipTrigger>
                        <TooltipContent side='right'>
                          <p>
                            {me?.emailVerified
                              ? t('email_verified')
                              : t('email_not_verified')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      className='cursor-default'
                      id='email'
                      readOnly
                      type='email'
                      value={email}
                    />
                    <Button
                      className='shrink-0'
                      onClick={handleEmailEditClick}
                      size='icon'
                      variant='outline'
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h2 className='font-medium text-xl tracking-tight'>
                  {t('preferences')}
                </h2>

                <div className='space-y-2'>
                  <Label htmlFor='timezone'>{t('timezone')}</Label>
                  <Combobox
                    allowCustom={false}
                    emptyText={t('no_timezone_found')}
                    groupHeading={t('timezones')}
                    items={timezones.map((tz) => tz.value)}
                    onChange={(value) =>
                      handleTimezoneChange(value as Timezone)
                    }
                    placeholder={t('select_timezone')}
                    renderItem={(item) => (
                      <div className='flex w-full items-center justify-between'>
                        <span>
                          {(() => {
                            const tz = timezones.find(
                              (timezoneItem) => timezoneItem.value === item
                            );
                            return tz ? `${tz.value} (${tz.code})` : item;
                          })()}
                        </span>
                        {timezone === item && <Check className='h-4 w-4' />}
                      </div>
                    )}
                    searchPlaceholder={t('search_timezone')}
                    value={timezone}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent className='space-y-4' value='password'>
            <div className='space-y-4'>
              <div>
                <h2 className='font-medium text-2xl tracking-tight'>
                  {hasPassword ? t('change_password') : t('create_a_password')}
                </h2>
                {!hasPassword && (
                  <p className='mt-2 text-muted-foreground text-sm'>
                    {t('password_not_set_description')}
                  </p>
                )}
              </div>
              <form className='space-y-4' onSubmit={handlePasswordSubmit}>
                {hasPassword && (
                  <div className='space-y-2'>
                    <Label htmlFor='currentPassword'>
                      {t('current_password')}
                    </Label>
                    <Input
                      id='currentPassword'
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      type='password'
                      value={currentPassword}
                    />
                  </div>
                )}
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>{t('new_password')}</Label>
                  <Input
                    id='newPassword'
                    onChange={(e) => setNewPassword(e.target.value)}
                    type='password'
                    value={newPassword}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>
                    {t('confirm_new_password')}
                  </Label>
                  <Input
                    id='confirmPassword'
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type='password'
                    value={confirmPassword}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  {hasPassword && (
                    <Button
                      className='text-muted-foreground hover:text-foreground'
                      onClick={handleForgotPassword}
                      type='button'
                      variant='ghost'
                    >
                      {t('forgot_current_password')}
                    </Button>
                  )}
                  <Button
                    className={hasPassword ? '' : 'ml-auto'}
                    disabled={isPasswordLoading}
                    type='submit'
                  >
                    {(() => {
                      if (isPasswordLoading) {
                        return hasPassword
                          ? t('updating_password')
                          : t('creating_password');
                      }
                      return hasPassword
                        ? t('update_password')
                        : t('create_password');
                    })()}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        onOpenChange={(open) => {
          setIsEmailDialogOpen(open);
          if (!open) {
            setEmailError('');
            setPendingEmail('');
            setConfirmPendingEmail('');
          }
        }}
        open={isEmailDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('update_email_address')}</DialogTitle>
            <DialogDescription>
              {t('update_email_address_description')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='newEmail'>{t('new_email')}</Label>
              <Input
                id='newEmail'
                onChange={(e) => setPendingEmail(e.target.value)}
                placeholder={t('enter_new_email')}
                type='email'
                value={pendingEmail}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmEmail'>{t('confirm_new_email')}</Label>
              <Input
                id='confirmEmail'
                onChange={(e) => setConfirmPendingEmail(e.target.value)}
                placeholder={t('confirm_new_email')}
                type='email'
                value={confirmPendingEmail}
              />
            </div>
            {emailError && (
              <p className='text-destructive text-sm'>{emailError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsEmailDialogOpen(false)}
              variant='outline'
            >
              {t('cancel')}
            </Button>
            <Button
              disabled={
                updateAccount.isPending || !pendingEmail || !confirmPendingEmail
              }
              onClick={confirmEmailChange}
            >
              {updateAccount.isPending ? t('updating') : t('update_email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={t('send_reset_link')}
        description={t('forgot_password_logout_warning')}
        onConfirm={confirmForgotPassword}
        onOpenChange={setShowLogoutConfirmDialog}
        open={showLogoutConfirmDialog}
        title={t('forgot_password_title')}
      />
    </div>
  );
}
