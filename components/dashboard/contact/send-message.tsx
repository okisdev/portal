'use client';

import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Contact } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { MessageSquare, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SendMessageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient?: Contact;
}

export function SendMessage({ open, onOpenChange, recipient }: SendMessageProps) {
  if (!recipient) return null;

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

  const handleClose = () => {
    setMessage('');
    setIsSelectingTemplate(false);
    onOpenChange(false);
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!recipient.phone) {
      toast.error('Contact does not have a phone number');
      return;
    }

    // Log the message activity
    createContactActivity.mutate({
      contactId: recipient.id,
      type: 'MESSAGE_SENT',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      title: 'WhatsApp Message Sent',
      description: message,
      metadata: {
        message,
      },
    });

    // Open WhatsApp with the message
    const whatsappUrl = `https://wa.me/${recipient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSelectTemplate = (template: any) => {
    setMessage(template.content);
    setIsSelectingTemplate(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Send WhatsApp Message</DialogTitle>
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
            </div>
          </div>

          {isSelectingTemplate ? (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium'>Select Template</h3>
                <Button variant='outline' size='sm' onClick={() => setIsSelectingTemplate(false)}>
                  Back to Editor
                </Button>
              </div>
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
                  <p className='text-muted-foreground text-sm'>No message templates found. Create templates with tags "whatsapp" or "message" to use them here.</p>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium'>Message</h3>
                <Button variant='outline' size='sm' onClick={() => setIsSelectingTemplate(true)}>
                  Use Template
                </Button>
              </div>
              <TipTapEditor content={message} onChange={setMessage} placeholder='Write your message...' className='min-h-[200px]' defaultMode='markdown' />
            </div>
          )}
        </div>

        <div className='flex items-center justify-between border-t pt-4'>
          <div className='flex items-center gap-2'>
            <MessageSquare className='size-4 text-muted-foreground' />
            <span className='text-muted-foreground text-sm'>Message will be sent via WhatsApp</span>
          </div>
          <Button className='gap-2' onClick={handleSend} disabled={createContactActivity.isPending}>
            <Send className='size-4' />
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
