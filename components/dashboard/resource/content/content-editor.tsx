import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ResourceContent } from '@/lib/schema';
import { Eye, EyeOff, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ContentEditorProps {
  content: ResourceContent | null;
  onUpdate: (data: Partial<ResourceContent>) => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function ContentEditor({ content, onUpdate, onDelete, isLoading }: ContentEditorProps) {
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(content?.title || '');
  const [tempDescription, setTempDescription] = useState(content?.description || '');
  const [editorContent, setEditorContent] = useState(content?.content || '');

  useEffect(() => {
    if (content) {
      setTempTitle(content.title);
      setTempDescription(content.description || '');
      setEditorContent(content.content);
      setEditingTitle(false);
      setEditingDescription(false);
      setIsViewMode(false);
    }
  }, [content]);

  const handleTitleEdit = () => {
    if (!isViewMode && content) {
      onUpdate({
        title: tempTitle,
      });
      setEditingTitle(false);
    }
  };

  const handleDescriptionEdit = () => {
    if (!isViewMode && content) {
      onUpdate({
        description: tempDescription || undefined,
      });
      setEditingDescription(false);
    }
  };

  const handleContentChange = (value: string) => {
    if (!isViewMode) {
      setEditorContent(value);
      onUpdate({
        content: value,
      });
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
            <button type='button' className='w-full text-left font-medium hover:bg-accent/50 px-2 py-1 rounded' onClick={() => !isViewMode && setEditingTitle(true)} disabled={isViewMode}>
              {content.title}
            </button>
          )}
          {editingDescription && !isViewMode ? (
            <Input
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              onBlur={handleDescriptionEdit}
              onKeyDown={(e) => e.key === 'Enter' && handleDescriptionEdit()}
              className='h-8 text-sm text-muted-foreground'
            />
          ) : (
            <button
              type='button'
              className='w-full text-left text-muted-foreground text-sm hover:bg-accent/50 px-2 py-1 rounded'
              onClick={() => !isViewMode && setEditingDescription(true)}
              disabled={isViewMode}
            >
              {content.description || 'Add a description...'}
            </button>
          )}
        </div>
        <div className='space-x-2'>
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
      <div className='h-[calc(100vh-150px)] rounded-lg border bg-background'>
        <div className='flex-1'>
          <ScrollArea className='h-full'>
            <TipTapEditor key={content.id} content={editorContent} onChange={handleContentChange} editable={!isViewMode} className='border-none' />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
