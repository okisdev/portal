'use client';

import { MetadataPopover } from '@/components/shared/metadata-popover';
import { NameTag } from '@/components/shared/name-tag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { ArrowUpRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactActivityProps {
  contactId: string;
}

export function ContactActivity({ contactId }: ContactActivityProps) {
  const t = useTranslations();
  const { data: session } = useSession();

  const utils = api.useUtils();

  const { data: activities } = api.contact.getContactActivities.useQuery({
    id: contactId,
  });

  const [newActivity, setNewActivity] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null);

  const createContactActivity = api.contact.createContactActivity.useMutation({
    onSuccess: () => {
      setNewActivity('');
      utils.contact.getContactActivities.invalidate({ id: contactId });
      toast.success('Activity created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newActivity.trim()) {
      toast.error('Activity cannot be empty');
      return;
    }

    createContactActivity.mutate({
      contactId: contactId,
      type: 'ENGAGEMENT',
      subType: 'NOTE_ADDED',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      description: newActivity,
    });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim() || !replyingTo) {
      toast.error('Reply cannot be empty');
      return;
    }

    createContactActivity.mutate({
      contactId: contactId,
      type: 'ENGAGEMENT',
      subType: 'NOTE_ADDED',
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      description: replyText,
      metadata: { replyTo: replyingTo },
    });

    setReplyText('');
    setReplyingTo(null);
  };

  const scrollToNote = (noteId: string) => {
    const element = document.getElementById(`note-${noteId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedNote(noteId);
      setTimeout(() => setHighlightedNote(null), 2000);
    }
  };

  return (
    <div className='relative flex flex-1 flex-col'>
      <div className='absolute inset-0 overflow-y-auto pb-[5.5rem] sm:pb-[4.5rem]'>
        <div className='space-y-1'>
          {activities?.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_activities_found')}</p>}
          {activities
            ?.filter((activity) => activity.type !== 'CONTACT' && activity.subType !== 'CONTACT_UPDATED')
            .map((activity, index) => {
              const currentDate = new Date(activity.createdAt).toDateString();
              const prevDate = index > 0 ? new Date(activities[index - 1].createdAt).toDateString() : null;
              const showDateDivider = currentDate !== prevDate;

              return (
                <div key={activity.id} id={`note-${activity.id}`}>
                  {showDateDivider && (
                    <div className='sticky top-0 bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                      <p className='font-medium text-muted-foreground text-sm'>{currentDate}</p>
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex items-start gap-3 border-l-2 py-3 pr-2 pl-4 hover:bg-muted/30',
                      highlightedNote === activity.id && 'bg-neutral-500/20 dark:bg-neutral-500/50',
                      activity.metadata && JSON.parse(activity.metadata).replyTo && 'ml-4'
                    )}
                    style={{
                      borderLeftColor:
                        activity.type === 'ENGAGEMENT'
                          ? 'rgb(59 130 246)'
                          : activity.type === 'DATE'
                          ? 'rgb(249 115 22)'
                          : activity.type === 'STATUS'
                          ? 'rgb(34 197 94)'
                          : activity.type === 'TEAM'
                          ? 'rgb(234 179 8)'
                          : activity.type === 'DEAL'
                          ? 'rgb(236 72 153)'
                          : activity.type === 'PAYMENT'
                          ? 'rgb(16 185 129)'
                          : activity.type === 'CAMPAIGN'
                          ? 'rgb(239 68 68)'
                          : activity.type === 'CONTACT'
                          ? 'rgb(250 204 21)'
                          : 'rgb(156 163 175)',
                    }}
                  >
                    <div className='flex-1 space-y-1'>
                      <div className='flex w-full items-center justify-between'>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='font-medium'>{activity.subType && t(activity.subType)}</span>
                          <span className='text-muted-foreground text-xs'>•</span>
                          {activity.initiatorType === 'system' ? (
                            <span className='text-muted-foreground text-xs'>{t('by_system')}</span>
                          ) : (
                            <span className='flex items-center gap-1 text-muted-foreground text-xs'>
                              {t.rich('by', {
                                name: () => <NameTag id={activity.userId} type='user' />,
                              })}
                            </span>
                          )}
                          <span className='text-muted-foreground text-xs'>•</span>
                          <span className='text-muted-foreground text-xs'>{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          {activity.metadata && (
                            <MetadataPopover title={t('view_details')}>
                              <pre className='whitespace-pre-wrap font-mono text-xs'>{JSON.stringify(JSON.parse(activity.metadata), null, 2)}</pre>
                            </MetadataPopover>
                          )}
                          {activity.type === 'ENGAGEMENT' && activity.subType === 'NOTE_ADDED' && (
                            <button type='button' onClick={() => setReplyingTo(activity.id)} className='rounded-md bg-muted/50 px-1 py-0.5 text-muted-foreground text-xs hover:bg-muted'>
                              {t('reply')}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={cn('text-sm', activity.type === 'ENGAGEMENT' && activity.subType === 'NOTE_ADDED' ? 'rounded-md bg-blue-50 p-3 dark:bg-blue-950/50' : '')}>
                        {activity.description}
                      </div>
                      {replyingTo === activity.id && (
                        <form onSubmit={handleReplySubmit} className='mt-2 flex items-start gap-2'>
                          <div className='flex-1'>
                            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder='Write a reply...' className='h-8' />
                          </div>
                          <div className='flex gap-1'>
                            <Button type='submit' size='sm' disabled={createContactActivity.isPending}>
                              {t('reply')}
                            </Button>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              {t('cancel')}
                            </Button>
                          </div>
                        </form>
                      )}
                      {activity.metadata && JSON.parse(activity.metadata).replyTo && (
                        <button
                          type='button'
                          onClick={() => scrollToNote(JSON.parse(activity.metadata as string).replyTo)}
                          className='mt-1 flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground'
                        >
                          <ArrowUpRight className='size-3' />
                          {t('jump_to_original_note')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <div className='absolute right-0 bottom-0 left-0 bg-background p-4 sm:pt-4'>
        <form onSubmit={handleSubmitActivity} className='flex max-w-full flex-col gap-2 sm:flex-row'>
          <Input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder='Add a note...' className='h-8 flex-1' />
          <Button type='submit' size='sm' disabled={createContactActivity.isPending} className='w-full sm:w-auto'>
            {t('add_note')}
          </Button>
        </form>
      </div>
    </div>
  );
}
