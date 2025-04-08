'use client';

import { ComboboxCommand } from '@/components/shared/combobox';
import { MetadataPopover } from '@/components/shared/metadata-popover';
import { NameTag } from '@/components/shared/name-tag';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUpload } from '@/hooks/use-upload';
import type { ActivitySubType } from '@/lib/schema';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/i18n';
import type { Activity } from '@/utils/activity';
import { renderDescription } from '@/utils/activity';
import { dateLocaleMap, formatDate } from '@/utils/date';
import { api } from '@/utils/trpc/client';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ArrowUpRight, Download, FileIcon, ImageIcon, Paperclip, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ActivitySectionProps {
  activities?: Activity[];
  onCreateActivity: (data: { type: string; subType: string; description: string; initiatorType: 'user' | 'system'; initiatorId: string; metadata?: string }) => void;
  isLoading?: boolean;
  filterTypes?: ActivitySubType[];
}

export function ActivitySection({ activities, onCreateActivity, isLoading, filterTypes }: ActivitySectionProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { data: session } = useSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  const [newActivity, setNewActivity] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [highlightedNote, setHighlightedNote] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const { data: users } = api.user.getAllUsers.useQuery();

  const userMentionData =
    users?.map((user) => ({
      id: user.id,
      username: user.username ?? user.id,
      display: user.name ?? user.username ?? user.id,
      name: user.name,
    })) ?? [];

  const userMentionItems = userMentionData.map((user) => user.username);

  const { uploadToR2, isUploading } = useUpload({
    onSuccess: (url) => {
      setUploadProgress(null);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadProgress(`Upload error: ${error.message}`);
    },
    onProgress: (info) => {
      setUploadProgress(info);
    },
  });

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

    if (!newActivity.trim() && attachments.length === 0) return;

    onCreateActivity({
      type: 'ENGAGEMENT',
      subType: 'NOTE_ADDED',
      description: newActivity,
      initiatorType: 'user',
      initiatorId: session?.user.id || '',
      metadata: attachments.length > 0 ? JSON.stringify({ attachments }) : undefined,
    });

    setNewActivity('');
    setAttachments([]);
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
      metadata: JSON.stringify({ replyTo: replyingTo }),
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
    if (e.key === 'Enter') {
      if (e.shiftKey || isComposing) {
        // Allow Shift+Enter for new line or when using IME
        return;
      }

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
  }, [activities]);

  const filteredActivities = activities?.filter((activity) => !filterTypes || filterTypes.includes(activity.subType));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToR2(file);

      // Add the file to attachments array
      setAttachments((prev) => [
        ...prev,
        {
          url,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file',
        },
      ]);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const renderAttachments = (metadata: string | null) => {
    if (!metadata) return null;

    try {
      const parsedMetadata = JSON.parse(metadata);
      if (!parsedMetadata.attachments || !Array.isArray(parsedMetadata.attachments)) return null;

      return (
        <div className='mt-2 flex flex-wrap gap-2'>
          {parsedMetadata.attachments.map((attachment: { url: string; name: string; type: string }) => (
            <div key={attachment.url} className='flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs'>
              {attachment.type === 'image' ? <ImageIcon className='h-3 w-3' /> : <FileIcon className='h-3 w-3' />}
              <a href={attachment.url} target='_blank' rel='noopener noreferrer' className='max-w-[150px] truncate hover:underline' title={attachment.name}>
                {attachment.name}
              </a>
              <a href={attachment.url} download className='text-muted-foreground hover:text-foreground' title={t('download')}>
                <Download className='h-3 w-3' />
              </a>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return null;
    }
  };

  return (
    <div className='flex h-full flex-col'>
      <div id='activities-container' className='flex-1 overflow-y-auto'>
        <div className='pointer-events-none sticky top-0 z-10 h-4 bg-linear-to-b from-background to-transparent' />
        <div className='space-y-1'>
          {filteredActivities?.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_activities_found')}</p>}
          {filteredActivities?.map((activity, index) => {
            const currentDate = format(new Date(activity.createdAt), 'PP', { locale: dateLocaleMap[locale] || enUS });
            const prevDate = index > 0 ? format(new Date(filteredActivities[index - 1].createdAt), 'PP', { locale: dateLocaleMap[locale] || enUS }) : null;
            const showDateDivider = currentDate !== prevDate;

            return (
              <div key={activity.id} id={`note-${activity.id}`}>
                {showDateDivider && (
                  <div className='sticky top-0 bg-background/95 py-2 backdrop-blur-sm supports-backdrop-filter:bg-background/60'>
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
                            {t.rich('by_who', {
                              name: () => <NameTag id={activity.userId || ''} type='user' />,
                            })}
                          </span>
                        )}
                        <span className='text-muted-foreground text-xs'>•</span>
                        <span className='text-muted-foreground text-xs'>{formatDate(new Date(activity.createdAt), locale as any)}</span>
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
                      {renderDescription(activity, t, locale)}
                      {renderAttachments(activity.metadata ?? null)}
                    </div>
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
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    placeholder={t('add_a_note')}
                    className='min-h-[60px] resize-none'
                  />
                  {uploadProgress && <div className='absolute bottom-2 left-2 text-xs text-muted-foreground'>{uploadProgress}</div>}
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
            <div className='mt-2 flex items-center gap-2'>
              <input type='file' ref={fileInputRef} onChange={handleFileUpload} className='hidden' accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt' />
              <Button type='button' size='sm' variant='outline' onClick={() => fileInputRef.current?.click()} disabled={isUploading} className='flex items-center gap-1'>
                <Paperclip className='h-4 w-4' />
                {t('attach_file')}
              </Button>
              {attachments.length > 0 && (
                <div className='flex flex-wrap gap-1'>
                  {attachments.map((attachment, index) => (
                    <div key={attachment.url} className='flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs'>
                      {attachment.type === 'image' ? <ImageIcon className='h-3 w-3' /> : <FileIcon className='h-3 w-3' />}
                      <span className='max-w-[150px] truncate' title={attachment.name}>
                        {attachment.name}
                      </span>
                      <button type='button' onClick={() => handleRemoveFile(index)} className='ml-1 text-muted-foreground hover:text-foreground'>
                        <X className='h-3 w-3' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button type='submit' size='sm' disabled={isLoading || isUploading} className='w-full sm:w-auto'>
            {t('add_note')}
          </Button>
        </form>
      </div>
    </div>
  );
}
