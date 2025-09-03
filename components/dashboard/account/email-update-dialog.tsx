'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { api } from '@/utils/trpc/client';

interface EmailUpdateDialogProps {
  open: boolean;
  currentEmail?: string;
  onOpenChange: (open: boolean) => void;
  onEmailUpdate?: (newEmail: string) => void;
}

export function EmailUpdateDialog({
  open,
  currentEmail = '',
  onOpenChange,
  onEmailUpdate,
}: EmailUpdateDialogProps) {
  const t = useTranslations();
  const updateAccount = api.account.updateMe.useMutation();

  const [pendingEmail, setPendingEmail] = useState('');
  const [confirmPendingEmail, setConfirmPendingEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setEmailError('');
      setPendingEmail('');
      setConfirmPendingEmail('');
    }
  };

  const confirmEmailChange = async () => {
    if (pendingEmail !== confirmPendingEmail) {
      setEmailError(t('emails_do_not_match'));
      return;
    }

    // Check if email has actually changed
    if (pendingEmail === currentEmail) {
      handleOpenChange(false);
      return;
    }

    try {
      await updateAccount.mutateAsync(
        {
          email: pendingEmail,
        },
        {
          onSuccess: () => {
            if (onEmailUpdate) {
              onEmailUpdate(pendingEmail);
            }
            handleOpenChange(false);
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

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
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
          <Button onClick={() => handleOpenChange(false)} variant='outline'>
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
  );
}
