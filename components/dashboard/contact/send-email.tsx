'use client';

import { Calendar, File, Send, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth.client';
import type { Contact } from '@/lib/schema';
import { randomString } from '@/lib/utils';
import { api } from '@/utils/trpc/client';

interface SendEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Contact;
}

interface EmailFormData {
  subject: string;
  content: string;
  cc: string[];
  bcc: string[];
  attachments: File[];
}

export function SendEmail({ open, onOpenChange, recipient }: SendEmailProps) {
  const t = useTranslations();
  const utils = api.useUtils();
  const { data: session } = authClient.useSession();
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    content: '',
    cc: [],
    bcc: [],
    attachments: [],
  });
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const sendEmail = api.contact.sendEmail.useMutation({
    onSuccess: () => {
      toast.success(t('email_sent_successfully'));
      if (recipient?.id) {
        utils.contact.getContactById.invalidate({ id: recipient.id });
      }
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // const scheduleEmail = api.contact.scheduleEmail.useMutation({
  //   onSuccess: () => {
  //     toast.success(t('email_scheduled_successfully'));
  //     handleClose();
  //   },
  //   onError: (error) => {
  //     toast.error(error.message);
  //   },
  // });

  const handleClose = () => {
    setFormData({
      subject: '',
      content: '',
      cc: [],
      bcc: [],
      attachments: [],
    });
    setShowCcBcc(false);
    setIsScheduleMode(false);
    setScheduledDate(null);
    onOpenChange(false);
  };

  const handleSend = () => {
    if (!formData.subject.trim()) {
      toast.error(t('please_enter_a_subject'));
      return;
    }

    if (!formData.content.trim()) {
      toast.error(t('please_enter_a_message'));
      return;
    }

    if (isScheduleMode && !scheduledDate) {
      toast.error(t('please_select_a_schedule_date'));
      return;
    }

    if (!recipient?.email) {
      toast.error(t('please_enter_a_valid_email'));
      return;
    }

    const emailData = {
      to: recipient.email,
      subject: formData.subject,
      content: formData.content,
      cc: formData.cc,
      bcc: formData.bcc,
      attachments: formData.attachments,
      contactId: recipient.id,
    };

    if (isScheduleMode && scheduledDate) {
      // scheduleEmail.mutate({
      //   ...emailData,
      //   scheduledAt: scheduledDate,
      // });
    } else {
      sendEmail.mutate(emailData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  if (!recipient) {
    return null;
  }

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle>{t('compose_email')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2 sm:py-4'>
          <div className='flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:gap-4'>
            <div className='w-full text-muted-foreground text-sm sm:w-16'>
              {t('from')}
            </div>
            <div className='flex items-center gap-2'>
              <Avatar className='size-6'>
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className='text-sm'>{session?.user?.name}</span>
            </div>
          </div>

          <div className='flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:gap-4'>
            <div className='w-full text-muted-foreground text-sm sm:w-16'>
              {t('to')}
            </div>
            <div className='flex flex-1 flex-wrap items-center gap-2'>
              <div className='flex items-center gap-2 rounded-full border bg-muted px-2 py-1'>
                <Avatar className='size-6'>
                  <AvatarImage src='' />
                  <AvatarFallback>{recipient.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className='text-sm'>{recipient.name}</span>
              </div>
              <Button
                className='text-muted-foreground hover:text-foreground'
                onClick={() => setShowCcBcc(!showCcBcc)}
                size='sm'
                variant='ghost'
              >
                {showCcBcc ? 'Hide CC/BCC' : 'Add CC/BCC'}
              </Button>
            </div>
          </div>

          {showCcBcc && (
            <>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4'>
                <div className='w-full text-muted-foreground text-sm sm:w-16'>
                  CC
                </div>
                <Input
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cc: e.target.value
                        .split(',')
                        .map((email) => email.trim()),
                    }))
                  }
                  placeholder='Enter CC email addresses (comma separated)'
                  value={formData.cc.join(', ')}
                />
              </div>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4'>
                <div className='w-full text-muted-foreground text-sm sm:w-16'>
                  BCC
                </div>
                <Input
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bcc: e.target.value
                        .split(',')
                        .map((email) => email.trim()),
                    }))
                  }
                  placeholder='Enter BCC email addresses (comma separated)'
                  value={formData.bcc.join(', ')}
                />
              </div>
            </>
          )}

          <div className='space-y-4'>
            <Input
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder='Subject'
              value={formData.subject}
            />
            <TipTapEditor
              className='min-h-[200px]'
              content={formData.content}
              onChange={(content) =>
                setFormData((prev) => ({ ...prev, content }))
              }
              placeholder='Write your message...'
            />
          </div>

          <div className='space-y-4 border-t pt-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-medium text-sm'>{t('attachments')}</h3>
              <input
                className='hidden'
                id='file-upload'
                multiple
                onChange={handleFileChange}
                type='file'
              />
              <label
                className='cursor-pointer text-muted-foreground text-xs hover:text-foreground'
                htmlFor='file-upload'
              >
                {t('add_attachment')}
              </label>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              {formData.attachments.map((file, index) => (
                <div
                  className='flex items-center gap-3 rounded-lg border p-3'
                  key={file.name + randomString(10)}
                >
                  <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                    <File className='size-5 text-blue-600' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm'>{file.name}</p>
                    <p className='text-muted-foreground text-xs'>
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                  <Button
                    className='size-6'
                    onClick={() => removeAttachment(index)}
                    size='icon'
                    variant='ghost'
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row'>
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <Button
              onClick={() =>
                setFormData((prev) => ({ ...prev, attachments: [] }))
              }
              size='icon'
              variant='outline'
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
          <div className='flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row'>
            {isScheduleMode ? (
              <Input
                className='w-full sm:w-auto'
                onChange={(e) => setScheduledDate(new Date(e.target.value))}
                type='datetime-local'
                value={scheduledDate?.toISOString().slice(0, 16) || ''}
              />
            ) : null}
            <Button
              className='w-full gap-2 sm:w-auto'
              onClick={() => setIsScheduleMode(!isScheduleMode)}
              variant='outline'
            >
              <Calendar className='size-4' />
              {isScheduleMode ? t('cancel_schedule') : t('schedule')}
            </Button>
            <Button
              className='w-full gap-2 sm:w-auto'
              disabled={sendEmail.isPending}
              onClick={handleSend}
            >
              <Send className='size-4' />
              {isScheduleMode ? t('schedule') : t('send')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
