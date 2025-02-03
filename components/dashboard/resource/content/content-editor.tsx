import { Combobox } from '@/components/shared/combobox';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contentTags } from '@/data/data';
import type { ResourceContent } from '@/lib/schema';
import { Database, Eye, EyeOff, Plus, Save, Tags, Trash, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
        <div className='flex items-center gap-1'>
          <button type='button' onClick={() => !disabled && setIsEditing(true)} disabled={disabled} className='flex flex-wrap items-center gap-1 rounded-sm px-1 hover:bg-accent/40'>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='gap-0.5 py-0.5 text-xs'>
                  {tag}
                  {!disabled && (
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      className='ml-1 cursor-pointer rounded-full outline-none hover:text-destructive'
                    >
                      <X className='size-2.5' />
                    </div>
                  )}
                </Badge>
              ))
            ) : (
              <span className='text-muted-foreground text-xs'>{t('add_tags')}</span>
            )}
          </button>
          {tags.length > 0 && !disabled && (
            <Button variant='ghost' size='sm' onClick={() => setIsEditing(true)} className='h-5 w-5 p-0'>
              <Plus className='size-3' />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentEditor({ content, onUpdate, onDelete, isLoading }: ContentEditorProps) {
  const t = useTranslations();

  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(content?.title || '');
  const [tempDescription, setTempDescription] = useState(content?.description || '');
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
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-1'>
            {editingTitle && !isViewMode ? (
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleEdit()}
                className='h-8 font-medium text-base'
              />
            ) : (
              <button type='button' className='w-full rounded-sm p-0.5 text-left font-medium text-base hover:bg-accent/40' onClick={() => !isViewMode && setEditingTitle(true)} disabled={isViewMode}>
                {content.title}
              </button>
            )}
            {editingDescription && !isViewMode ? (
              <Input
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleDescriptionEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleDescriptionEdit()}
                className='h-7 text-muted-foreground text-sm'
              />
            ) : (
              <button
                type='button'
                className='w-full rounded-sm p-0.5 text-left text-muted-foreground text-sm hover:bg-accent/40'
                onClick={() => !isViewMode && setEditingDescription(true)}
                disabled={isViewMode}
              >
                {content.description || t('add_a_description')}
              </button>
            )}
            <TagManager tags={tempTags} onTagsChange={handleTagsChange} disabled={isViewMode} />
          </div>
          <div className='flex items-center gap-1'>
            {hasUnsavedChanges && !isViewMode && (
              <Button variant='ghost' size='sm' onClick={handleSave} disabled={isLoading} className='h-7 gap-1 px-2 text-xs'>
                <Save className='h-3 w-3' />
                {t('save')}
              </Button>
            )}
            <Button variant='ghost' size='sm' onClick={() => setShowSendHistory(true)} className='h-7 w-7 p-0'>
              <Database className='h-3 w-3' />
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setIsViewMode(!isViewMode)} className='h-7 w-7 p-0'>
              {isViewMode ? <Eye className='h-3 w-3' /> : <EyeOff className='h-3 w-3' />}
            </Button>
            {!isViewMode && (
              <Button variant='ghost' size='sm' onClick={onDelete} className='h-7 w-7 p-0'>
                <Trash className='h-3 w-3 text-destructive' />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className='flex-1'>
        <TipTapEditor key={content.id} content={editorContent} onChange={handleContentChange} disabled={isViewMode} editable={!isViewMode} className='h-full' />
      </div>

      {content && <SendHistoryDialog open={showSendHistory} onOpenChange={setShowSendHistory} content={content} />}
    </div>
  );
}
