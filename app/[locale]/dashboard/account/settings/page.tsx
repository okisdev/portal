'use client';

import {
  BadgeX,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Pencil,
  Plus,
  Trash2,
  Verified,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Combobox } from '@/components/shared/combobox';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { data: apiKeys, refetch: refetchApiKeys } =
    api.apiKey.getApiKeys.useQuery();

  const updateAccount = api.account.updateMe.useMutation();
  const updateTimezone = api.account.updateTimezone.useMutation();
  const createApiKey = api.apiKey.createApiKey.useMutation();
  const deleteApiKey = api.apiKey.deleteApiKey.useMutation();

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

  // API Key states
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>(
    []
  );
  const [isFullAccess, setIsFullAccess] = useState(true);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

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

  // API Key functions
  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newApiKeyName.trim()) {
      toast.error(t('api_key_name_required'));
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({
        name: newApiKeyName.trim(),
        permissions: isFullAccess ? [] : newApiKeyPermissions,
      });

      setGeneratedApiKey(result.apiKey);
      setNewApiKeyName('');
      setNewApiKeyPermissions([]);
      setIsFullAccess(true);
      setShowApiKey(true);
      toast.success(t('api_key_created_successfully'));
      refetchApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error(t('failed_to_create_api_key'));
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await deleteApiKey.mutateAsync({ id });
      toast.success(t('api_key_deleted_successfully'));
      setDeleteKeyId(null);
      refetchApiKeys();
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error(t('failed_to_delete_api_key'));
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied_to_clipboard'));
    } catch {
      toast.error(t('failed_to_copy_to_clipboard'));
    }
  };

  const resetApiKeyDialog = () => {
    setIsApiKeyDialogOpen(false);
    setGeneratedApiKey(null);
    setShowApiKey(false);
    setNewApiKeyName('');
    setNewApiKeyPermissions([]);
    setIsFullAccess(true);
  };

  // Available permissions
  const availablePermissions = [
    {
      value: 'read:contacts',
      label: 'Read Contacts',
      description: 'View contact information',
    },
    {
      value: 'write:contacts',
      label: 'Write Contacts',
      description: 'Create, update, and delete contacts',
    },
    {
      value: 'read:calendar',
      label: 'Read Calendar',
      description: 'View calendar events',
    },
    {
      value: 'write:calendar',
      label: 'Write Calendar',
      description: 'Create, update, and delete calendar events',
    },
    { value: 'read:tasks', label: 'Read Tasks', description: 'View tasks' },
    {
      value: 'write:tasks',
      label: 'Write Tasks',
      description: 'Create, update, and delete tasks',
    },
    {
      value: 'read:resources',
      label: 'Read Resources',
      description: 'View resources and content',
    },
    {
      value: 'write:resources',
      label: 'Write Resources',
      description: 'Create, update, and delete resources',
    },
  ];

  const togglePermission = (permission: string) => {
    setNewApiKeyPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
    // If we're selecting individual permissions, turn off full access
    setIsFullAccess(false);
  };

  const toggleFullAccess = (checked: boolean) => {
    setIsFullAccess(checked);
    if (checked) {
      setNewApiKeyPermissions([]);
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
            <TabsTrigger value='api-keys'>API Keys</TabsTrigger>
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

          <TabsContent className='space-y-4' value='api-keys'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <h2 className='font-semibold text-2xl tracking-tight'>
                    {t('api_keys')}
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    {t('api_keys_description')}
                  </p>
                </div>
                <Button onClick={() => setIsApiKeyDialogOpen(true)} size='sm'>
                  <Plus className='mr-2 h-4 w-4' />
                  {t('generate_api_key')}
                </Button>
              </div>

              {/* API Keys List */}
              {apiKeys?.length === 0 ? (
                <div className='rounded-lg border border-dashed bg-card p-12 text-center'>
                  <Key className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                  <h3 className='mb-2 font-semibold text-lg'>
                    {t('no_api_keys')}
                  </h3>
                  <p className='mx-auto mb-4 max-w-md text-muted-foreground text-sm'>
                    {t('no_api_keys_description')}
                  </p>
                  <Button
                    onClick={() => setIsApiKeyDialogOpen(true)}
                    variant='outline'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    {t('generate_your_first_api_key')}
                  </Button>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {apiKeys?.map((key) => (
                    <div
                      className='group rounded-lg border bg-card p-4 shadow-sm'
                      key={key.id}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1 space-y-3'>
                          <div className='space-y-2'>
                            <h4 className='font-semibold text-lg'>
                              {key.name}
                            </h4>

                            <div className='flex items-center gap-3 text-muted-foreground text-sm'>
                              <code className='rounded bg-muted px-2 py-1 font-mono text-xs'>
                                {key.keyPrefix}••••••••••••••••••••
                              </code>
                              <span>•</span>
                              <span>
                                {t('created')}{' '}
                                {key.createdAt.toLocaleDateString()}
                              </span>
                              {key.lastUsedAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {t('last_used')}{' '}
                                    {key.lastUsedAt.toLocaleDateString()}
                                  </span>
                                </>
                              )}
                              {key.usageCount !== null &&
                                key.usageCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {t('api_calls', {
                                        count: key.usageCount,
                                      })}
                                    </span>
                                  </>
                                )}
                            </div>
                          </div>

                          {key.permissions &&
                            JSON.parse(key.permissions).length > 0 && (
                              <div className='space-y-2'>
                                <p className='font-medium text-sm'>
                                  {t('permissions')}
                                </p>
                                <div className='flex flex-wrap gap-1'>
                                  {JSON.parse(key.permissions).map(
                                    (permission: string) => (
                                      <Badge
                                        className='text-xs'
                                        key={permission}
                                        variant='outline'
                                      >
                                        {permission}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        <div className='flex items-center'>
                          <Button
                            onClick={() => setDeleteKeyId(key.id)}
                            size='sm'
                            variant='outline'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Create API Key Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (open) {
            setIsApiKeyDialogOpen(open);
          } else {
            resetApiKeyDialog();
          }
        }}
        open={isApiKeyDialogOpen}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {generatedApiKey
                ? t('api_key_generated')
                : t('generate_new_api_key')}
            </DialogTitle>
            <DialogDescription>
              {generatedApiKey
                ? t('save_api_key_warning')
                : t('create_new_api_key_description')}
            </DialogDescription>
          </DialogHeader>

          {generatedApiKey ? (
            <div className='space-y-4 py-4'>
              <div className='space-y-3'>
                <Label className='font-semibold text-sm'>
                  {t('your_new_api_key')}
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    className='font-mono text-sm'
                    readOnly
                    type={showApiKey ? 'text' : 'password'}
                    value={generatedApiKey}
                  />
                  <Button
                    onClick={() => setShowApiKey(!showApiKey)}
                    size='sm'
                    variant='outline'
                  >
                    {showApiKey ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(generatedApiKey)}
                    size='sm'
                    variant='outline'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950'>
                <p className='text-amber-900 text-sm dark:text-amber-100'>
                  <strong>{t('important')}:</strong> {t('api_key_save_warning')}
                </p>
              </div>
              <DialogFooter>
                <Button onClick={resetApiKeyDialog}>
                  {t('ive_saved_my_api_key')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreateApiKey}>
              <div className='space-y-6 py-4'>
                <div className='space-y-3'>
                  <Label className='font-semibold' htmlFor='apiKeyName'>
                    {t('name')}
                  </Label>
                  <Input
                    id='apiKeyName'
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    placeholder={t('api_key_name_placeholder')}
                    type='text'
                    value={newApiKeyName}
                  />
                </div>

                <div className='space-y-3'>
                  <Label className='font-semibold'>{t('permissions')}</Label>
                  <div className='space-y-4 rounded-lg border p-4'>
                    {/* Full Access Option */}
                    <div className='flex items-start space-x-3 rounded-md border bg-blue-50/50 p-4 dark:bg-blue-950/20'>
                      <Checkbox
                        checked={isFullAccess}
                        id='full-access'
                        onCheckedChange={toggleFullAccess}
                      />
                      <div className='flex-1'>
                        <Label
                          className='cursor-pointer font-medium text-sm'
                          htmlFor='full-access'
                        >
                          {t('full_access')}
                        </Label>
                        <p className='text-muted-foreground text-xs leading-relaxed'>
                          {t('full_access_description')}
                        </p>
                      </div>
                    </div>

                    {!isFullAccess && (
                      <>
                        <div className='my-4 h-px bg-border' />
                        <div className='mb-3 space-y-1'>
                          <p className='font-medium text-sm'>
                            {t('or_select_specific_permissions')}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {t('select_specific_permissions_description')}
                          </p>
                        </div>
                        <div className='grid gap-3 sm:grid-cols-2'>
                          {availablePermissions.map((permission) => (
                            <div
                              className='flex items-start space-x-3 rounded-md p-3 transition-colors hover:bg-muted/50'
                              key={permission.value}
                            >
                              <Checkbox
                                checked={newApiKeyPermissions.includes(
                                  permission.value
                                )}
                                id={permission.value}
                                onCheckedChange={() =>
                                  togglePermission(permission.value)
                                }
                              />
                              <div className='flex-1'>
                                <Label
                                  className='cursor-pointer font-medium text-sm'
                                  htmlFor={permission.value}
                                >
                                  {permission.label}
                                </Label>
                                <p className='text-muted-foreground text-xs leading-relaxed'>
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={resetApiKeyDialog}
                  type='button'
                  variant='outline'
                >
                  {t('cancel')}
                </Button>
                <Button
                  disabled={createApiKey.isPending || !newApiKeyName.trim()}
                  type='submit'
                >
                  {createApiKey.isPending
                    ? t('generating')
                    : t('generate_api_key')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete API Key Dialog */}
      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={
          deleteApiKey.isPending ? t('deleting') : t('delete_api_key')
        }
        description={t('delete_api_key_warning')}
        onConfirm={() => deleteKeyId && handleDeleteApiKey(deleteKeyId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteKeyId(null);
          }
        }}
        open={!!deleteKeyId}
        title={t('delete_api_key')}
      />
    </div>
  );
}
