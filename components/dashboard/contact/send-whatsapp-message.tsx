'use client';

import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Contact, ResourceContent } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { MessageSquare, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface SendWhatsAppMessageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Contact;
}

export function SendWhatsAppMessage({ open, onOpenChange, recipient }: SendWhatsAppMessageProps) {
  if (!recipient) return null;

  const t = useTranslations();

  const utils = api.useUtils();
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(false);

  const { data: templates } = api.resource.getContents.useQuery({
    visibility: ['PUBLIC', 'SHARED', 'PRIVATE'],
    tags: ['whatsapp', 'message'],
  });

  const createContactActivity = api.contact.createContactActivity.useMutation({
    onSuccess: () => {
      utils.contact.getContactById.invalidate({ id: recipient.id });
      utils.contact.getContactActivities.invalidate({ id: recipient.id });
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendWhatsAppMessage = api.external.sendWhatsAppMessage.useMutation({
    onSuccess: () => {
      toast.success(t('whatsapp_message_sent_successfully'));
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createContentSendTrack = api.resource.createContentSendTrack.useMutation({
    onSuccess: () => {
      utils.resource.getContents.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setMessage('');
    setIsSelectingTemplate(false);
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!recipient.phone) {
      toast.error('Contact does not have a phone number');
      return;
    }

    // Send message via WhatsApp
    sendWhatsAppMessage.mutate({
      to: recipient.phone.replace(/\D/g, ''),
      message: message,
    });

    // Log the message activity
    createContactActivity.mutate({
      contactId: recipient.id,
      type: 'ENGAGEMENT',
      subType: 'MESSAGE_SENT',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      description: message,
      metadata: {
        message,
      },
    });
  };

  const handleSelectTemplate = (template: ResourceContent) => {
    setMessage(template.content);
    setIsSelectingTemplate(false);

    // Track that this template was sent to the contact
    createContentSendTrack.mutate({
      resourceId: template.id,
      contactId: recipient.id,
      status: 'sent',
      metadata: {
        channel: 'whatsapp',
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle>{t('send_whatsapp_message')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2 sm:py-4'>
          <div className='flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:gap-4'>
            <div className='w-full text-muted-foreground text-sm sm:w-4'>{t('from')}</div>
            <div className='flex items-center gap-2'>
              <Avatar className='size-6'>
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className='text-sm'>{session?.user?.name}</span>
            </div>
          </div>

          <div className='flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:gap-4'>
            <div className='w-full text-muted-foreground text-sm sm:w-4'>{t('to')}</div>
            <div className='flex flex-1 flex-wrap items-center gap-2'>
              <div className='flex items-center gap-2 rounded-full border bg-muted px-2 py-1'>
                <Avatar className='size-6'>
                  <AvatarImage src='' />
                  <AvatarFallback>{recipient.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className='text-sm'>
                  {recipient.name} ({recipient.phone})
                </span>
              </div>
            </div>
          </div>

          {isSelectingTemplate ? (
            <div className='space-y-4'>
              <div className='flex flex-col items-center justify-between gap-2 sm:flex-row'>
                <h3 className='font-medium'>{t('select_template')}</h3>
                <Button variant='outline' size='sm' onClick={() => setIsSelectingTemplate(false)} className='w-full sm:w-auto'>
                  {t('back_to_editor')}
                </Button>
              </div>
              <div className='max-h-[300px] overflow-y-auto'>
                {templates && templates.length > 0 ? (
                  <div className='grid gap-2'>
                    {templates.map((template) => (
                      <button
                        key={template.resourceContent.id}
                        type='button'
                        onClick={() => handleSelectTemplate(template.resourceContent)}
                        className='flex flex-col gap-1 rounded-lg border p-3 text-left hover:bg-accent'
                      >
                        <span className='font-medium'>{template.resourceContent.title}</span>
                        <span className='text-muted-foreground text-sm'>{template.resourceContent.description}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed p-4 text-center'>
                    <p className='text-muted-foreground text-sm'>{t('no_message_templates_found')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex flex-col items-center justify-between gap-2 sm:flex-row'>
                <h3 className='font-medium'>{t('message')}</h3>
                <Button variant='outline' size='sm' onClick={() => setIsSelectingTemplate(true)} className='w-full sm:w-auto'>
                  {t('use_template')}
                </Button>
              </div>
              <TipTapEditor content={message} onChange={setMessage} placeholder='Write your message...' className='min-h-[200px]' defaultMode='markdown' />
            </div>
          )}
        </div>

        <div className='flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row'>
          <div className='flex w-full items-center gap-2 sm:w-auto'>
            <MessageSquare className='size-4 text-muted-foreground' />
            <span className='text-muted-foreground text-sm'>{t('message_will_be_sent_via_whatsapp')}</span>
          </div>
          <Button className='w-full gap-2 sm:w-auto' onClick={handleSend} disabled={createContactActivity.isPending}>
            <Send className='size-4' />
            {t('send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
