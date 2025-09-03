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
  const revokeApiKey = api.apiKey.revokeApiKey.useMutation();
  const toggleApiKey = api.apiKey.toggleApiKey.useMutation();

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
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

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
      toast.error('API key name is required');
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({
        name: newApiKeyName.trim(),
        permissions: newApiKeyPermissions,
      });

      setGeneratedApiKey(result.apiKey);
      setNewApiKeyName('');
      setNewApiKeyPermissions([]);
      setShowApiKey(true);
      toast.success('API key created successfully');
      refetchApiKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const handleRevokeApiKey = async (id: string, reason?: string) => {
    try {
      await revokeApiKey.mutateAsync({ id, reason });
      toast.success('API key revoked successfully');
      setRevokeKeyId(null);
      setRevokeReason('');
      refetchApiKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handleToggleApiKey = async (id: string, isActive: boolean) => {
    try {
      await toggleApiKey.mutateAsync({ id, isActive });
      toast.success(
        `API key ${isActive ? 'enabled' : 'disabled'} successfully`
      );
      refetchApiKeys();
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      toast.error('Failed to update API key status');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const resetApiKeyDialog = () => {
    setIsApiKeyDialogOpen(false);
    setGeneratedApiKey(null);
    setShowApiKey(false);
    setNewApiKeyName('');
    setNewApiKeyPermissions([]);
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
                <div>
                  <h2 className='font-medium text-2xl tracking-tight'>
                    API Keys
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    Manage your API keys to authenticate with the Portal API
                  </p>
                </div>
                <Button onClick={() => setIsApiKeyDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Generate API Key
                </Button>
              </div>

              {/* API Keys List */}
              <div className='space-y-4'>
                {apiKeys?.length === 0 ? (
                  <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
                    <Key className='mb-4 h-12 w-12 text-muted-foreground' />
                    <h3 className='mb-2 font-semibold text-lg'>No API keys</h3>
                    <p className='mb-4 text-muted-foreground text-sm'>
                      You haven't created any API keys yet. Generate your first
                      API key to get started.
                    </p>
                    <Button
                      onClick={() => setIsApiKeyDialogOpen(true)}
                      variant='outline'
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Generate Your First API Key
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {apiKeys?.map((key) => (
                      <div
                        className='flex items-center justify-between rounded-lg border p-4'
                        key={key.id}
                      >
                        <div className='flex-1 space-y-1'>
                          <div className='flex items-center gap-2'>
                            <h4 className='font-medium'>{key.name}</h4>

                            {key.revokedAt ? (
                              <Badge variant='destructive'>Revoked</Badge>
                            ) : (
                              <Badge
                                variant={key.isActive ? 'default' : 'secondary'}
                              >
                                {key.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          {key.permissions && (
                            <div className='mt-1 flex flex-wrap gap-1'>
                              {JSON.parse(key.permissions)
                                .slice(0, 3)
                                .map((permission: string) => (
                                  <Badge
                                    className='text-xs'
                                    key={permission}
                                    variant='outline'
                                  >
                                    {permission}
                                  </Badge>
                                ))}
                              {JSON.parse(key.permissions).length > 3 && (
                                <Badge className='text-xs' variant='outline'>
                                  +{JSON.parse(key.permissions).length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className='flex items-center gap-4 text-muted-foreground text-sm'>
                            <span>
                              <code className='rounded bg-muted px-1 py-0.5 text-xs'>
                                {key.keyPrefix}...
                              </code>
                            </span>
                            <span>
                              Created {key.createdAt.toLocaleDateString()}
                            </span>
                            {key.lastUsedAt && (
                              <span>
                                Last used {key.lastUsedAt.toLocaleDateString()}
                              </span>
                            )}
                            {key.usageCount !== null && (
                              <span>Used {key.usageCount} times</span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {!key.revokedAt && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() =>
                                      handleToggleApiKey(key.id, !key.isActive)
                                    }
                                    size='sm'
                                    variant='outline'
                                  >
                                    {key.isActive ? (
                                      <EyeOff className='h-4 w-4' />
                                    ) : (
                                      <Eye className='h-4 w-4' />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {key.isActive ? 'Disable' : 'Enable'} API key
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => setRevokeKeyId(key.id)}
                                    size='sm'
                                    variant='outline'
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Revoke API key</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {generatedApiKey ? 'API Key Generated' : 'Generate New API Key'}
            </DialogTitle>
            <DialogDescription>
              {generatedApiKey
                ? "Save this API key somewhere secure. You won't be able to see it again."
                : 'Create a new API key for your application.'}
            </DialogDescription>
          </DialogHeader>

          {generatedApiKey ? (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Your new API key</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    readOnly
                    type={showApiKey ? 'text' : 'password'}
                    value={generatedApiKey}
                  />
                  <Button
                    onClick={() => setShowApiKey(!showApiKey)}
                    size='icon'
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
                    size='icon'
                    variant='outline'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='rounded-lg bg-amber-50 p-3 dark:bg-amber-950'>
                <p className='text-amber-900 text-sm dark:text-amber-100'>
                  ⚠️ Save this API key now. For security reasons, you won't be
                  able to view it again.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={resetApiKeyDialog} variant='outline'>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreateApiKey}>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='apiKeyName'>Name</Label>
                  <Input
                    id='apiKeyName'
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    placeholder='e.g., Mobile App, Production Server'
                    type='text'
                    value={newApiKeyName}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Permissions</Label>
                  <div className='max-h-48 space-y-2 overflow-y-auto rounded-md border p-3'>
                    {availablePermissions.map((permission) => (
                      <div
                        className='flex items-center space-x-3'
                        key={permission.value}
                      >
                        <input
                          checked={newApiKeyPermissions.includes(
                            permission.value
                          )}
                          className='rounded border-gray-300'
                          id={permission.value}
                          onChange={() => togglePermission(permission.value)}
                          type='checkbox'
                        />
                        <div className='flex-1'>
                          <Label
                            className='cursor-pointer font-medium text-sm'
                            htmlFor={permission.value}
                          >
                            {permission.label}
                          </Label>
                          <p className='text-muted-foreground text-xs'>
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                    {newApiKeyPermissions.length === 0 && (
                      <p className='text-muted-foreground text-sm italic'>
                        Select permissions or leave empty for full access
                      </p>
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
                  Cancel
                </Button>
                <Button
                  disabled={createApiKey.isPending || !newApiKeyName.trim()}
                  type='submit'
                >
                  {createApiKey.isPending
                    ? 'Generating...'
                    : 'Generate API Key'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setRevokeKeyId(null);
            setRevokeReason('');
          }
        }}
        open={!!revokeKeyId}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The API key will be permanently
              revoked.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='revokeReason'>Reason (optional)</Label>
              <Input
                id='revokeReason'
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder='e.g., Security breach, No longer needed'
                type='text'
                value={revokeReason}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setRevokeKeyId(null);
                setRevokeReason('');
              }}
              variant='outline'
            >
              Cancel
            </Button>
            <Button
              disabled={revokeApiKey.isPending}
              onClick={() =>
                revokeKeyId &&
                handleRevokeApiKey(revokeKeyId, revokeReason || undefined)
              }
              variant='destructive'
            >
              {revokeApiKey.isPending ? 'Revoking...' : 'Revoke API Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
