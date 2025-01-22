'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Contact } from '@/lib/schema';
import { generateUUID } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Calendar, File, Send, Trash2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

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
  if (!recipient) return null;

  const { data: session } = useSession();
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
      toast.success('Email sent successfully');
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // const scheduleEmail = api.contact.scheduleEmail.useMutation({
  //   onSuccess: () => {
  //     toast.success('Email scheduled successfully');
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
      toast.error('Please enter a subject');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (isScheduleMode && !scheduledDate) {
      toast.error('Please select a schedule date');
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Compose email</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex items-center gap-4 border-b pb-4'>
            <div className='w-16 text-muted-foreground text-sm'>From</div>
            <div className='flex items-center gap-2'>
              <Avatar className='size-6'>
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className='text-sm'>{session?.user?.name}</span>
            </div>
          </div>

          <div className='flex items-center gap-4 border-b pb-4'>
            <div className='w-16 text-muted-foreground text-sm'>To</div>
            <div className='flex flex-1 flex-wrap items-center gap-2'>
              <div className='flex items-center gap-2 rounded-full border bg-muted px-2 py-1'>
                <Avatar className='size-6'>
                  <AvatarImage src='' />
                  <AvatarFallback>{recipient.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className='text-sm'>{recipient.name}</span>
              </div>
              <Button variant='ghost' size='sm' onClick={() => setShowCcBcc(!showCcBcc)} className='text-muted-foreground hover:text-foreground'>
                {showCcBcc ? 'Hide CC/BCC' : 'Add CC/BCC'}
              </Button>
            </div>
          </div>

          {showCcBcc && (
            <>
              <div className='flex items-center gap-4'>
                <div className='w-16 text-muted-foreground text-sm'>CC</div>
                <Input
                  placeholder='Enter CC email addresses (comma separated)'
                  value={formData.cc.join(', ')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cc: e.target.value.split(',').map((email) => email.trim()) }))}
                />
              </div>
              <div className='flex items-center gap-4'>
                <div className='w-16 text-muted-foreground text-sm'>BCC</div>
                <Input
                  placeholder='Enter BCC email addresses (comma separated)'
                  value={formData.bcc.join(', ')}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bcc: e.target.value.split(',').map((email) => email.trim()) }))}
                />
              </div>
            </>
          )}

          <div className='space-y-4'>
            <Input placeholder='Subject' className='border-0 px-0 text-lg' value={formData.subject} onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))} />
            <Textarea
              placeholder='Write your message...'
              className='min-h-[200px] border-0 px-0'
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div className='space-y-4 border-t pt-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-medium text-sm'>Attachments</h3>
              <input type='file' multiple onChange={handleFileChange} className='hidden' id='file-upload' />
              <label htmlFor='file-upload' className='cursor-pointer text-muted-foreground text-xs hover:text-foreground'>
                Add attachment
              </label>
            </div>
            <div className='grid grid-cols-3 gap-4'>
              {formData.attachments.map((file, index) => (
                <div key={file.name + generateUUID()} className='flex items-center gap-3 rounded-lg border p-3'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                    <File className='size-5 text-blue-600' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm'>{file.name}</p>
                    <p className='text-muted-foreground text-xs'>{Math.round(file.size / 1024)} KB</p>
                  </div>
                  <Button variant='ghost' size='icon' onClick={() => removeAttachment(index)} className='size-6'>
                    <X className='size-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between border-t pt-4'>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='icon' onClick={() => setFormData((prev) => ({ ...prev, attachments: [] }))}>
              <Trash2 className='size-4' />
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            {isScheduleMode ? (
              <Input type='datetime-local' value={scheduledDate?.toISOString().slice(0, 16) || ''} onChange={(e) => setScheduledDate(new Date(e.target.value))} className='w-auto' />
            ) : null}
            <Button variant='outline' className='gap-2' onClick={() => setIsScheduleMode(!isScheduleMode)}>
              <Calendar className='size-4' />
              {isScheduleMode ? 'Cancel Schedule' : 'Schedule'}
            </Button>
            <Button className='gap-2' onClick={handleSend} disabled={sendEmail.isPending}>
              <Send className='size-4' />
              {isScheduleMode ? 'Schedule' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
