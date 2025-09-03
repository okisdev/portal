'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
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

export default function AccountSettingsPage() {
  const t = useTranslations();

  const { data: me, isLoading } = api.account.getMeFromDatabase.useQuery();

  // Dialog states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [showLogoutConfirmDialog, setShowLogoutConfirmDialog] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    // TODO: Implement image upload logic
  };

  const handleEmailEditClick = () => {
    setIsEmailDialogOpen(true);
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
            <TabsTrigger value='api-keys'>{t('api_keys')}</TabsTrigger>
          </TabsList>

          <TabsContent className='space-y-4' value='profile'>
            <div className='space-y-8'>
              <ProfilePicture
                firstName={me?.firstName ?? ''}
                image={me?.image ?? ''}
                lastName={me?.lastName ?? ''}
                onImageUpload={handleImageUpload}
              />

              <PersonalInformation
                initialData={{
                  firstName: me?.firstName ?? undefined,
                  lastName: me?.lastName ?? undefined,
                  username: me?.username ?? undefined,
                  email: me?.email ?? undefined,
                  emailVerified: me?.emailVerified,
                }}
                isLoading={isLoading}
                onEmailEditClick={handleEmailEditClick}
              />

              <PreferencesSection
                initialTimezone={(me?.timezone as Timezone) ?? 'Asia/Hong_Kong'}
              />
            </div>
          </TabsContent>

          <TabsContent className='space-y-4' value='password'>
            <PasswordSection
              initialHasPassword={me?.hasPassword}
              onForgotPassword={handleForgotPassword}
              setPasswordAction={setPasswordAction}
              userEmail={me?.email ?? undefined}
            />
          </TabsContent>

          <TabsContent className='space-y-4' value='api-keys'>
            <ApiKeysSection
              onCreateApiKey={() => setIsApiKeyDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EmailUpdateDialog
        currentEmail={me?.email ?? undefined}
        onOpenChange={setIsEmailDialogOpen}
        open={isEmailDialogOpen}
      />

      <ApiKeyDialog
        onOpenChange={setIsApiKeyDialogOpen}
        open={isApiKeyDialogOpen}
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
    </div>
  );
}
