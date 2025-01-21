'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AlignCenter, AlignLeft, AlignRight, Bold, Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Quote, Redo, Strikethrough, Underline as UnderlineIcon, Undo } from 'lucide-react';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  disabled?: boolean;
}

export function TipTapEditor({ content, onChange, placeholder = 'Start writing...', editable = true, className, disabled = false }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg border border-border',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    editable: editable && !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl dark:prose-invert mx-auto h-full w-full flex-1 overflow-auto outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive = false, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) => (
    <Button type='button' variant='ghost' size='icon' className={cn('h-8 w-8', isActive && 'bg-muted')} onClick={onClick}>
      {children}
    </Button>
  );

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={cn('rounded-lg border', className)}>
      {editable && (
        <div className='flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1'>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
            <Bold className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
            <Italic className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
            <UnderlineIcon className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
            <Strikethrough className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')}>
            <LinkIcon className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={addImage}>
            <ImageIcon className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
            <AlignLeft className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
            <AlignCenter className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}>
            <AlignRight className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
            <List className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
            <ListOrdered className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
            <Quote className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
            <Undo className='h-4 w-4' />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
            <Redo className='h-4 w-4' />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} className='prose prose-sm dark:prose-invert max-w-none p-4' />
    </div>
  );
}
