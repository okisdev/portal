'use client';

import { useTranslations } from 'next-intl';
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

interface EmailUpdateDialogProps {
  open: boolean;
  pendingEmail: string;
  confirmPendingEmail: string;
  emailError: string;
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onPendingEmailChange: (value: string) => void;
  onConfirmPendingEmailChange: (value: string) => void;
  onConfirmEmailChange: () => void;
}

export function EmailUpdateDialog({
  open,
  pendingEmail,
  confirmPendingEmail,
  emailError,
  isUpdating,
  onOpenChange,
  onPendingEmailChange,
  onConfirmPendingEmailChange,
  onConfirmEmailChange,
}: EmailUpdateDialogProps) {
  const t = useTranslations();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
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
              onChange={(e) => onPendingEmailChange(e.target.value)}
              placeholder={t('enter_new_email')}
              type='email'
              value={pendingEmail}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirmEmail'>{t('confirm_new_email')}</Label>
            <Input
              id='confirmEmail'
              onChange={(e) => onConfirmPendingEmailChange(e.target.value)}
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
          <Button onClick={() => onOpenChange(false)} variant='outline'>
            {t('cancel')}
          </Button>
          <Button
            disabled={isUpdating || !pendingEmail || !confirmPendingEmail}
            onClick={onConfirmEmailChange}
          >
            {isUpdating ? t('updating') : t('update_email')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
