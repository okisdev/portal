'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient, signOut } from '@/lib/auth.client';

interface PasswordSectionProps {
  initialHasPassword?: boolean;
  userEmail?: string;
  onForgotPassword?: () => void;
  setPasswordAction: (
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function PasswordSection({
  initialHasPassword = false,
  userEmail,
  onForgotPassword,
  setPasswordAction,
}: PasswordSectionProps) {
  const t = useTranslations();

  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    setHasPassword(initialHasPassword);
  }, [initialHasPassword]);

  const validatePasswordForm = (): boolean => {
    // For users with password, check all fields; for users without password, only check new password fields
    if (hasPassword) {
      if (!(currentPassword && newPassword && confirmPassword)) {
        return false;
      }
    } else if (!(newPassword && confirmPassword)) {
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('passwords_do_not_match'));
      return false;
    }

    return true;
  };

  const handleExistingPasswordChange = async () => {
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
  };

  const handleNewPasswordCreation = async () => {
    const result = await setPasswordAction(newPassword);

    if (result.success) {
      toast.success(t('password_created_successfully'));
      setHasPassword(true);
    } else {
      toast.error(result.error || t('failed_to_create_password'));
    }
  };

  const clearPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordLoading(true);

    try {
      if (hasPassword) {
        await handleExistingPasswordChange();
      } else {
        await handleNewPasswordCreation();
      }
      clearPasswordForm();
    } catch (error) {
      console.error('Failed to handle password operation:', error);
      toast.error(t('unexpected_error'));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (onForgotPassword) {
      onForgotPassword();
      return;
    }

    // Default forgot password logic
    if (!userEmail) {
      toast.error(t('no_email_found'));
      return;
    }

    try {
      await authClient.forgetPassword({
        email: userEmail,
        redirectTo: `${window.location.origin}/reset-password?email=${userEmail}`,
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
    }
  };

  return (
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
            <Label htmlFor='currentPassword'>{t('current_password')}</Label>
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
          <Label htmlFor='confirmPassword'>{t('confirm_new_password')}</Label>
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
              return hasPassword ? t('update_password') : t('create_password');
            })()}
          </Button>
        </div>
      </form>
    </div>
  );
}
