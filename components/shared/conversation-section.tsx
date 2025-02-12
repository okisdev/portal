'use client';

import { ComboboxCommand } from '@/components/shared/combobox';
import { MetadataPopover } from '@/components/shared/metadata-popover';
import { NameTag } from '@/components/shared/name-tag';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Activity {
  id: string;
  type: string;
  subType: string;
  description: string;
  initiatorType: 'user' | 'system' | 'contact';
  userId?: string;
  metadata?: {
    messageId?: string;
    timestamp?: number;
    channel?: 'whatsapp';
    message?: string;
    status?: string;
    conversationId?: string;
    replyTo?: string;
  } | null;
  createdAt: Date;
}

interface ConversationSectionProps {
  activities?: Activity[];
  onCreateActivity: (data: { type: string; subType: string; description: string; initiatorType: 'user' | 'system'; initiatorId: string; metadata?: any }) => void;
  isLoading?: boolean;
  contactId?: string;
}

export function ConversationSection({ activities, onCreateActivity, isLoading, contactId }: ConversationSectionProps) {
  const t = useTranslations();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [newActivity, setNewActivity] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const { data: users } = api.user.getAllUsers.useQuery();

  const conversationActivities = useMemo(() => {
    return activities
      ?.filter((activity) => activity.type === 'ENGAGEMENT' && (activity.subType === 'MESSAGE_SENT' || activity.subType === 'MESSAGE_RECEIVED' || activity.subType === 'NOTE_ADDED'))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activities]);

  const userMentionData =
    users?.map((user) => ({
      id: user.id,
      username: user.username ?? user.id,
      display: user.name ?? user.username ?? user.id,
      name: user.name,
    })) ?? [];

  const userMentionItems = userMentionData.map((user) => user.username);

  const renderMentionItem = (username: string) => {
    const user = userMentionData.find((u) => u.username === username);

    if (!user) return username;

    return (
      <div className='flex items-start gap-2'>
        <Avatar className='h-6 w-6'>
          <AvatarImage src={user.display} alt={user.name ?? user.username} />
          <AvatarFallback>{(user.name ?? user.username)[0]}</AvatarFallback>
        </Avatar>
        <span className='text-left'>{user.name ?? user.username}</span>
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>, isReply = false) => {
    const value = e.target.value;
    isReply ? setReplyText(value) : setNewActivity(value);

    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol === -1) {
      setShowMentions(false);
      return;
    }

    const textFromLastAt = textBeforeCursor.slice(lastAtSymbol + 1);

    if (textFromLastAt.includes(' ')) {
      setShowMentions(false);
      return;
    }

    setMentionSearch(textFromLastAt);
    setShowMentions(true);
  };

  const handleMention = useCallback(
    (username: string, isReply = false) => {
      const currentValue = isReply ? replyText : newActivity;
      const beforeMention = currentValue.slice(0, currentValue.lastIndexOf('@'));
      const afterMention = currentValue.slice(cursorPosition);
      const newValue = `${beforeMention}@${username} ${afterMention}`;

      if (isReply) {
        setReplyText(newValue);
        const replyInput = document.getElementById('replyInput') as HTMLInputElement;
        if (replyInput) {
          replyInput.focus();
          const newCursorPos = beforeMention.length + username.length + 2;
          replyInput.setSelectionRange(newCursorPos, newCursorPos);
        }
      } else {
        setNewActivity(newValue);
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = beforeMention.length + username.length + 2;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }

      setShowMentions(false);
    },
    [newActivity, replyText, cursorPosition]
  );

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newActivity.trim()) return;

    onCreateActivity({
      type: 'ENGAGEMENT',
      subType: 'NOTE_ADDED',
      description: newActivity,
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      metadata: replyingTo ? { replyTo: replyingTo } : undefined,
    });

    setNewActivity('');
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim() || !replyingTo) return;

    onCreateActivity({
      type: 'ENGAGEMENT',
      subType: 'NOTE_ADDED',
      description: replyText,
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      metadata: replyingTo ? { replyTo: replyingTo } : undefined,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isReply = false) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (isReply) {
        if (replyText.trim() && replyingTo) {
          handleReplySubmit(e);
        }
      } else {
        if (newActivity.trim()) {
          handleSubmitActivity(e);
        }
      }
    }

    if (e.key === 'Escape' && showMentions) {
      e.preventDefault();
      setShowMentions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const popover = document.querySelector('[data-radix-popper-content-wrapper]');

      if (popover?.contains(target)) {
        return;
      }

      if (showMentions) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentions]);

  useEffect(() => {
    const container = document.getElementById('activities-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [conversationActivities]);

  return (
    <div className='flex h-full flex-col'>
      <div id='activities-container' className='flex-1 overflow-y-auto'>
        <div className='pointer-events-none sticky top-0 z-10 h-4 bg-gradient-to-b from-background to-transparent' />
        <div className='space-y-1'>
          {conversationActivities?.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_activities_found')}</p>}
          {conversationActivities?.map((activity, index) => {
            const currentDate = format(new Date(activity.createdAt), 'PP');
            const prevDate = index > 0 ? format(new Date(conversationActivities[index - 1].createdAt), 'PP') : null;
            const showDateDivider = currentDate !== prevDate;
            const isWhatsAppMessage = activity.metadata?.channel === 'whatsapp';
            const isIncoming = activity.subType === 'MESSAGE_RECEIVED';

            return (
              <div key={activity.id} id={`note-${activity.id}`}>
                {showDateDivider && (
                  <div className='sticky top-0 bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                    <p className='font-medium text-muted-foreground text-sm'>{currentDate}</p>
                  </div>
                )}
                <div
                  className={cn(
                    'flex items-start gap-3 py-3 pr-2 pl-4',
                    isWhatsAppMessage ? (isIncoming ? 'justify-start' : 'justify-end') : 'border-l-2 hover:bg-muted/30',
                    highlightedNote === activity.id && 'bg-neutral-500/20 dark:bg-neutral-500/50',
                    activity.metadata?.replyTo && 'ml-4'
                  )}
                  style={{
                    borderLeftColor: !isWhatsAppMessage ? 'rgb(59 130 246)' : 'transparent',
                  }}
                >
                  <div className={cn('flex-1 space-y-1', isWhatsAppMessage && 'max-w-[80%]')}>
                    <div className='flex w-full items-center justify-between'>
                      <div className='flex items-center gap-2 text-sm'>
                        {!isWhatsAppMessage && (
                          <>
                            <span className='font-medium'>{activity.subType && t(activity.subType)}</span>
                            <span className='text-muted-foreground text-xs'>•</span>
                          </>
                        )}
                        {activity.initiatorType === 'system' ? (
                          <span className='text-muted-foreground text-xs'>{t('by_system')}</span>
                        ) : (
                          <span className='flex items-center gap-1 text-muted-foreground text-xs'>
                            {t.rich('by_who', {
                              name: () => <NameTag id={activity.userId || ''} type='user' />,
                            })}
                          </span>
                        )}
                        <span className='text-muted-foreground text-xs'>•</span>
                        <span className='text-muted-foreground text-xs'>{formatDate(new Date(activity.createdAt))}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        {activity.metadata && !isWhatsAppMessage && (
                          <MetadataPopover title={t('view_details')}>
                            <pre className='whitespace-pre-wrap font-mono text-xs'>{JSON.stringify(activity.metadata, null, 2)}</pre>
                          </MetadataPopover>
                        )}
                        {!isWhatsAppMessage && activity.subType === 'NOTE_ADDED' && (
                          <button type='button' onClick={() => setReplyingTo(activity.id)} className='rounded-md bg-muted/50 px-1 py-0.5 text-muted-foreground text-xs hover:bg-muted'>
                            {t('reply')}
                          </button>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'text-sm',
                        isWhatsAppMessage ? (isIncoming ? 'rounded-lg bg-muted p-3' : 'rounded-lg bg-blue-500 text-white p-3') : 'rounded-md bg-blue-50 p-3 dark:bg-blue-950/50'
                      )}
                    >
                      {activity.description}
                    </div>
                    {activity.metadata?.status && isWhatsAppMessage && <div className='text-right text-muted-foreground text-xs'>{activity.metadata.status}</div>}
                    {replyingTo === activity.id && (
                      <form onSubmit={handleReplySubmit} className='mt-2 flex items-start gap-2'>
                        <div className='relative flex-1'>
                          <Popover open={showMentions}>
                            <PopoverTrigger asChild>
                              <div className='relative w-full'>
                                <Textarea
                                  id='replyInput'
                                  value={replyText}
                                  onChange={(e) => handleInputChange(e, true)}
                                  onKeyDown={(e) => handleKeyDown(e, true)}
                                  placeholder={t('write_a_reply')}
                                  className='min-h-[60px] resize-none'
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className='w-64 p-0' align='start'>
                              <ComboboxCommand
                                query={mentionSearch}
                                setQuery={setMentionSearch}
                                value=''
                                onChange={(username) => handleMention(username, true)}
                                setOpen={setShowMentions}
                                items={userMentionItems}
                                searchPlaceholder={t('search_users')}
                                emptyText={t('no_users_found')}
                                groupHeading={t('users')}
                                allowCustom={false}
                                renderItem={renderMentionItem}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className='flex gap-1'>
                          <Button type='submit' size='sm' disabled={isLoading}>
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
                    {activity.metadata?.replyTo && (
                      <button
                        type='button'
                        onClick={() => scrollToNote(activity.metadata?.replyTo as string)}
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
      <div className='mt-auto bg-background pt-4'>
        <form onSubmit={handleSubmitActivity} className='relative flex max-w-full flex-col gap-2 sm:flex-row'>
          <div className='relative flex-1'>
            <Popover open={showMentions}>
              <PopoverTrigger asChild>
                <div className='relative w-full'>
                  <Textarea
                    ref={inputRef}
                    value={newActivity}
                    onChange={(e) => handleInputChange(e)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    placeholder={replyingTo ? t('write_a_reply') : t('send_whatsapp_message')}
                    className='min-h-[60px] resize-none'
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className='w-64 p-0' align='start'>
                <ComboboxCommand
                  query={mentionSearch}
                  setQuery={setMentionSearch}
                  value=''
                  onChange={handleMention}
                  setOpen={setShowMentions}
                  items={userMentionItems}
                  searchPlaceholder={t('search_users')}
                  emptyText={t('no_users_found')}
                  groupHeading={t('users')}
                  allowCustom={false}
                  renderItem={renderMentionItem}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button type='submit' size='sm' disabled={isLoading} className='w-full sm:w-auto'>
            {replyingTo ? t('reply') : t('send')}
          </Button>
        </form>
      </div>
    </div>
  );
}
