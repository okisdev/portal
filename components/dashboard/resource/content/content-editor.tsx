import { formatDistanceToNow } from 'date-fns';
import {
  Clock,
  Database,
  Eye,
  EyeOff,
  Plus,
  Save,
  Tags,
  Trash,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Combobox } from '@/components/shared/combobox';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contentTags } from '@/data/data';
import type { ResourceContent } from '@/lib/schema';
import type { Locale } from '@/types/i18n';
import { dateLocaleMap } from '@/utils/date';
import { SendHistoryDialog } from './send-history-dialog';

interface ContentEditorProps {
  content: ResourceContent | null;
  onUpdate: (data: Partial<ResourceContent>) => void;
  onDelete: () => void;
  isLoading?: boolean;
}

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

function TagManager({ tags, onTagsChange, disabled }: TagManagerProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);

  const handleAddTag = (value: string) => {
    if (value && !tags.includes(value)) {
      onTagsChange([...tags, value]);
    }
    setIsEditing(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className='flex items-center gap-1.5'>
      <Tags className='size-3 text-muted-foreground' />
      {isEditing && !disabled ? (
        <div className='flex-1'>
          <Combobox
            allowCustom
            emptyText={t('no_matching_tags')}
            groupHeading={t('existing_tags')}
            items={contentTags}
            onChange={handleAddTag}
            placeholder={t('add_tags')}
            searchPlaceholder={t('tags_search_placeholder')}
            size='sm'
            value=''
          />
        </div>
      ) : (
        <div className='flex items-center gap-1'>
          <button
            className='flex flex-wrap items-center gap-1 rounded-sm px-1 hover:bg-accent/40'
            disabled={disabled}
            onClick={() => !disabled && setIsEditing(true)}
            type='button'
          >
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Badge
                  className='gap-0.5 py-0.5 text-xs'
                  key={tag}
                  variant='secondary'
                >
                  {tag}
                  {!disabled && (
                    <div
                      className='ml-1 cursor-pointer rounded-full outline-hidden hover:text-destructive'
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                    >
                      <X className='size-2.5' />
                    </div>
                  )}
                </Badge>
              ))
            ) : (
              <span className='text-muted-foreground text-xs'>
                {t('add_tags')}
              </span>
            )}
          </button>
          {tags.length > 0 && !disabled && (
            <Button
              className='h-5 w-5 p-0'
              onClick={() => setIsEditing(true)}
              size='sm'
              variant='ghost'
            >
              <Plus className='size-3' />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentEditor({
  content,
  onUpdate,
  onDelete,
  isLoading,
}: ContentEditorProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const dateLocale = dateLocaleMap[locale];

  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(content?.title || '');
  const [tempDescription, setTempDescription] = useState(
    content?.description || ''
  );
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [showSendHistory, setShowSendHistory] = useState(false);
  const [editorContent, setEditorContent] = useState(content?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (content) {
      setTempTitle(content.title);
      setTempDescription(content.description || '');
      setTempTags(content.tags ? JSON.parse(content.tags) : []);
      setEditorContent(content.content);
      setEditingTitle(false);
      setEditingDescription(false);
      setIsViewMode(false);
    }
  }, [content]);

  const handleTitleEdit = () => {
    if (!isViewMode && content && tempTitle !== content.title) {
      onUpdate({
        title: tempTitle,
      });
      setHasUnsavedChanges(true);
    }
    setEditingTitle(false);
  };

  const handleDescriptionEdit = () => {
    if (!isViewMode && content && tempDescription !== content.description) {
      onUpdate({
        description: tempDescription || undefined,
      });
      setHasUnsavedChanges(true);
    }
    setEditingDescription(false);
  };

  const handleTagsChange = (newTags: string[]) => {
    setTempTags(newTags);
    onUpdate({
      tags: newTags.length > 0 ? JSON.stringify(newTags) : null,
    });
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (value: string) => {
    if (!isViewMode) {
      setEditorContent(value);
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = () => {
    onUpdate({
      title: tempTitle,
      description: tempDescription || undefined,
      tags: tempTags.length > 0 ? JSON.stringify(tempTags) : null,
      content: editorContent,
    });
    setHasUnsavedChanges(false);
  };

  if (!content) return null;

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <div className='border-b bg-background px-4 py-3'>
        <div className='flex h-full items-start justify-between gap-4'>
          <div className='flex-1 space-y-1'>
            {editingTitle && !isViewMode ? (
              <Input
                className='h-8 font-medium text-base'
                onBlur={handleTitleEdit}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleEdit()}
                value={tempTitle}
              />
            ) : (
              <button
                className='w-full rounded-sm p-0.5 text-left font-medium text-base hover:bg-accent/40'
                disabled={isViewMode}
                onClick={() => !isViewMode && setEditingTitle(true)}
                type='button'
              >
                {content.title}
              </button>
            )}
            {editingDescription && !isViewMode ? (
              <Input
                className='h-7 text-muted-foreground text-sm'
                onBlur={handleDescriptionEdit}
                onChange={(e) => setTempDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDescriptionEdit()}
                value={tempDescription}
              />
            ) : (
              <button
                className='w-full rounded-sm p-0.5 text-left text-muted-foreground text-sm hover:bg-accent/40'
                disabled={isViewMode}
                onClick={() => !isViewMode && setEditingDescription(true)}
                type='button'
              >
                {content.description || t('add_a_description')}
              </button>
            )}
            <TagManager
              disabled={isViewMode}
              onTagsChange={handleTagsChange}
              tags={tempTags}
            />
          </div>
          <div className='flex h-full flex-col items-center justify-between'>
            <div className='flex items-center gap-1'>
              {hasUnsavedChanges && !isViewMode && (
                <Button
                  className='h-7 gap-1 px-2 text-xs'
                  disabled={isLoading}
                  onClick={handleSave}
                  size='sm'
                  variant='ghost'
                >
                  <Save className='h-3 w-3' />
                  {t('save')}
                </Button>
              )}
              <Button
                className='h-7 w-7 p-0'
                onClick={() => setShowSendHistory(true)}
                size='sm'
                variant='ghost'
              >
                <Database className='h-3 w-3' />
              </Button>
              <Button
                className='h-7 w-7 p-0'
                onClick={() => setIsViewMode(!isViewMode)}
                size='sm'
                variant='ghost'
              >
                {isViewMode ? (
                  <Eye className='h-3 w-3' />
                ) : (
                  <EyeOff className='h-3 w-3' />
                )}
              </Button>
              {!isViewMode && (
                <Button
                  className='h-7 w-7 p-0'
                  onClick={onDelete}
                  size='sm'
                  variant='ghost'
                >
                  <Trash className='h-3 w-3 text-destructive' />
                </Button>
              )}
            </div>
            <div className='flex flex-col items-start gap-0.5'>
              <div className='flex items-center gap-1.5 text-muted-foreground text-xs'>
                <Clock className='size-3' />
                {t('created_at_time', {
                  time: formatDistanceToNow(new Date(content.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  }),
                })}
              </div>
              <div className='flex items-center gap-1.5 text-muted-foreground text-xs'>
                <Clock className='size-3' />
                {t('last_updated_at', {
                  time: formatDistanceToNow(new Date(content.updatedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  }),
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1'>
        <TipTapEditor
          className='h-full'
          content={editorContent}
          disabled={isViewMode}
          editable={!isViewMode}
          key={content.id}
          onChange={handleContentChange}
        />
      </div>

      {content && (
        <SendHistoryDialog
          content={content}
          onOpenChange={setShowSendHistory}
          open={showSendHistory}
        />
      )}
    </div>
  );
}
