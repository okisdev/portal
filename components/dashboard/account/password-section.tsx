'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordSectionProps {
  hasPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isPasswordLoading: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordSubmit: (event: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export function PasswordSection({
  hasPassword,
  currentPassword,
  newPassword,
  confirmPassword,
  isPasswordLoading,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordSubmit,
  onForgotPassword,
}: PasswordSectionProps) {
  const t = useTranslations();

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
      <form className='space-y-4' onSubmit={onPasswordSubmit}>
        {hasPassword && (
          <div className='space-y-2'>
            <Label htmlFor='currentPassword'>{t('current_password')}</Label>
            <Input
              id='currentPassword'
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              type='password'
              value={currentPassword}
            />
          </div>
        )}
        <div className='space-y-2'>
          <Label htmlFor='newPassword'>{t('new_password')}</Label>
          <Input
            id='newPassword'
            onChange={(e) => onNewPasswordChange(e.target.value)}
            type='password'
            value={newPassword}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>{t('confirm_new_password')}</Label>
          <Input
            id='confirmPassword'
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            type='password'
            value={confirmPassword}
          />
        </div>
        <div className='flex items-center justify-between'>
          {hasPassword && (
            <Button
              className='text-muted-foreground hover:text-foreground'
              onClick={onForgotPassword}
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
