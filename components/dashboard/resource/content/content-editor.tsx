import { Combobox } from '@/components/shared/combobox';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contentTags } from '@/data/data';
import type { ResourceContent } from '@/lib/schema';
import { Database, Eye, EyeOff, Tags, Trash, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { SendHistoryDialog } from './send-history-dialog';

function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay]
  );
}

interface ContentEditorProps {
  content: ResourceContent | null;
  onUpdate: (data: Partial<ResourceContent>) => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function ContentEditor({ content, onUpdate, onDelete, isLoading }: ContentEditorProps) {
  const t = useTranslations();

  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [tempTitle, setTempTitle] = useState(content?.title || '');
  const [tempDescription, setTempDescription] = useState(content?.description || '');
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [showSendHistory, setShowSendHistory] = useState(false);
  const [editorContent, setEditorContent] = useState(content?.content || '');

  // Debounced update handlers
  const debouncedContentUpdate = useDebounce((value: string) => {
    onUpdate({
      content: value,
    });
  }, 1000); // 1 second delay

  useEffect(() => {
    if (content) {
      setTempTitle(content.title);
      setTempDescription(content.description || '');
      setTempTags(content.tags ? JSON.parse(content.tags) : []);
      setEditorContent(content.content);
      setEditingTitle(false);
      setEditingDescription(false);
      setEditingTags(false);
      setIsViewMode(false);
    }
  }, [content]);

  const handleTitleEdit = () => {
    if (!isViewMode && content && tempTitle !== content.title) {
      onUpdate({
        title: tempTitle,
      });
    }
    setEditingTitle(false);
  };

  const handleDescriptionEdit = () => {
    if (!isViewMode && content && tempDescription !== content.description) {
      onUpdate({
        description: tempDescription || undefined,
      });
    }
    setEditingDescription(false);
  };

  const handleAddTag = (value: string) => {
    if (value && !tempTags.includes(value)) {
      const newTags = [...tempTags, value];
      setTempTags(newTags);
      onUpdate({
        tags: newTags.length > 0 ? JSON.stringify(newTags) : null,
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tempTags.filter((tag) => tag !== tagToRemove);
    setTempTags(newTags);
    onUpdate({
      tags: newTags.length > 0 ? JSON.stringify(newTags) : null,
    });
  };

  const handleContentChange = (value: string) => {
    if (!isViewMode) {
      setEditorContent(value);
      debouncedContentUpdate(value);
    }
  };

  if (!content) return null;

  return (
    <div className='h-full space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col space-y-0.5'>
          {editingTitle && !isViewMode ? (
            <Input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} onBlur={handleTitleEdit} onKeyDown={(e) => e.key === 'Enter' && handleTitleEdit()} className='h-8 font-medium' />
          ) : (
            <button type='button' className='w-full rounded px-2 py-1 text-left font-medium hover:bg-accent/50' onClick={() => !isViewMode && setEditingTitle(true)} disabled={isViewMode}>
              {content.title}
            </button>
          )}
          {editingDescription && !isViewMode ? (
            <Input
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              onBlur={handleDescriptionEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleDescriptionEdit()}
              className='h-8 text-muted-foreground text-sm'
            />
          ) : (
            <button
              type='button'
              className='w-full rounded px-2 py-1 text-left text-muted-foreground text-sm hover:bg-accent/50'
              onClick={() => !isViewMode && setEditingDescription(true)}
              disabled={isViewMode}
            >
              {content.description || t('add_a_description')}
            </button>
          )}
          <div className='flex items-center gap-2 px-2 py-1'>
            <Tags className='size-3 text-muted-foreground' />
            {editingTags && !isViewMode ? (
              <div className='flex-1'>
                <Combobox
                  value=''
                  onChange={handleAddTag}
                  items={contentTags}
                  placeholder={t('add_tags')}
                  searchPlaceholder={t('tags_search_placeholder')}
                  emptyText={t('no_matching_tags')}
                  groupHeading={t('existing_tags')}
                  allowCustom
                  size='sm'
                />
              </div>
            ) : (
              <button type='button' onClick={() => !isViewMode && setEditingTags(true)} disabled={isViewMode} className='flex flex-wrap items-center gap-1 text-left hover:bg-accent/50'>
                {tempTags.length > 0 ? (
                  tempTags.map((tag) => (
                    <Badge key={tag} variant='secondary' className='gap-1'>
                      {tag}
                      {!isViewMode && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(tag);
                          }}
                          className='ml-1 cursor-pointer rounded-full outline-none hover:text-destructive'
                        >
                          <X className='size-3' />
                        </div>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className='text-muted-foreground text-sm'>{t('add_tags')}</span>
                )}
              </button>
            )}
          </div>
        </div>
        <div className='space-x-2'>
          <Button variant='outline' size='icon' onClick={() => setShowSendHistory(true)}>
            <Database className='h-4 w-4' />
          </Button>
          <Button variant='outline' size='icon' onClick={() => setIsViewMode(!isViewMode)}>
            {isViewMode ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
          </Button>
          {!isViewMode && (
            <Button variant='outline' size='icon' onClick={onDelete}>
              <Trash className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
      <div className='flex-1 rounded-lg border bg-background'>
        <div className='flex-1'>
          <ScrollArea className='h-full'>
            <TipTapEditor key={content.id} content={editorContent} onChange={handleContentChange} disabled={isViewMode} editable={!isViewMode} className='border-none' />
          </ScrollArea>
        </div>
      </div>

      {content && <SendHistoryDialog open={showSendHistory} onOpenChange={setShowSendHistory} content={content} />}
    </div>
  );
}
