'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiKeyDialog } from '@/components/dashboard/account/api-key-dialog';
import { ApiKeysSection } from '@/components/dashboard/account/api-keys-section';
import { EmailUpdateDialog } from '@/components/dashboard/account/email-update-dialog';
import { PasswordSection } from '@/components/dashboard/account/password-section';
import { PersonalInformation } from '@/components/dashboard/account/personal-information';
import { PreferencesSection } from '@/components/dashboard/account/preferences-section';
import { ProfilePicture } from '@/components/dashboard/account/profile-picture';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const resetApiKeyDialog = () => {
    setIsApiKeyDialogOpen(false);
    setGeneratedApiKey(null);
    setNewApiKeyName('');
    setNewApiKeyPermissions([]);
    setIsFullAccess(true);
  };

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
            <TabsTrigger value='api-keys'>{t('api_keys')}</TabsTrigger>
          </TabsList>

          <TabsContent className='space-y-4' value='profile'>
            <div className='space-y-8'>
              <ProfilePicture
                firstName={firstName}
                image={image}
                lastName={lastName}
                onImageUpload={handleImageUpload}
              />

              <PersonalInformation
                email={email}
                firstName={firstName}
                isEmailVerified={me?.emailVerified}
                isLoading={isLoading}
                lastName={lastName}
                onEmailEditClick={handleEmailEditClick}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onNameBlur={handleNameChange}
                onUsernameBlur={handleUsernameChange}
                onUsernameChange={setUsername}
                username={username}
                usernameError={usernameError}
              />

              <PreferencesSection
                onTimezoneChange={handleTimezoneChange}
                timezone={timezone}
              />
            </div>
          </TabsContent>

          <TabsContent className='space-y-4' value='password'>
            <PasswordSection
              confirmPassword={confirmPassword}
              currentPassword={currentPassword}
              hasPassword={hasPassword}
              isPasswordLoading={isPasswordLoading}
              newPassword={newPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onCurrentPasswordChange={setCurrentPassword}
              onForgotPassword={handleForgotPassword}
              onNewPasswordChange={setNewPassword}
              onPasswordSubmit={handlePasswordSubmit}
            />
          </TabsContent>

          <TabsContent className='space-y-4' value='api-keys'>
            <ApiKeysSection
              apiKeys={apiKeys}
              onCreateApiKey={() => setIsApiKeyDialogOpen(true)}
              onDeleteApiKey={(id) => setDeleteKeyId(id)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EmailUpdateDialog
        confirmPendingEmail={confirmPendingEmail}
        emailError={emailError}
        isUpdating={updateAccount.isPending}
        onConfirmEmailChange={confirmEmailChange}
        onConfirmPendingEmailChange={setConfirmPendingEmail}
        onOpenChange={(open) => {
          setIsEmailDialogOpen(open);
          if (!open) {
            setEmailError('');
            setPendingEmail('');
            setConfirmPendingEmail('');
          }
        }}
        onPendingEmailChange={setPendingEmail}
        open={isEmailDialogOpen}
        pendingEmail={pendingEmail}
      />

      <ActionAlertDialog
        cancelText={t('cancel')}
        confirmText={t('send_reset_link')}
        description={t('forgot_password_logout_warning')}
        onConfirm={confirmForgotPassword}
        onOpenChange={setShowLogoutConfirmDialog}
        open={showLogoutConfirmDialog}
        title={t('forgot_password_title')}
      />

      <ApiKeyDialog
        generatedApiKey={generatedApiKey}
        isCreating={createApiKey.isPending}
        isFullAccess={isFullAccess}
        newApiKeyName={newApiKeyName}
        newApiKeyPermissions={newApiKeyPermissions}
        onCreateApiKey={handleCreateApiKey}
        onFullAccessToggle={toggleFullAccess}
        onNameChange={setNewApiKeyName}
        onOpenChange={setIsApiKeyDialogOpen}
        onPermissionToggle={togglePermission}
        onResetDialog={resetApiKeyDialog}
        open={isApiKeyDialogOpen}
      />

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
