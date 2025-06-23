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
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  FileText,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import TurndownService from 'turndown';

type EditorMode = 'rich-text' | 'html' | 'markdown';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  disabled?: boolean;
  defaultMode?: EditorMode;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Customize turndown for WhatsApp-style markdown
turndownService.addRule('bold', {
  filter: ['strong', 'b'],
  replacement: (content) => `*${content}*`,
});

turndownService.addRule('italic', {
  filter: ['em', 'i'],
  replacement: (content) => `_${content}_`,
});

turndownService.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: (content) => `~${content}~`,
});

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  className,
  disabled = false,
  defaultMode = 'rich-text',
}: TipTapEditorProps) {
  const t = useTranslations();

  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [htmlContent, setHtmlContent] = useState(content);
  const [markdownContent, setMarkdownContent] = useState('');

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
      if (!disabled && editable) {
        const html = editor.getHTML();
        setHtmlContent(html);
        const markdown = turndownService.turndown(html);
        setMarkdownContent(markdown);
        onChange(mode === 'markdown' ? markdown : html);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl dark:prose-invert mx-auto h-full w-full flex-1 overflow-auto outline-hidden',
          !editable || disabled ? 'pointer-events-none' : ''
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable && !disabled);
    }
  }, [editor, editable, disabled]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setHtmlContent(content);
      setMarkdownContent(turndownService.turndown(content));
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      if (mode === 'markdown') {
        setMarkdownContent(turndownService.turndown(editor.getHTML()));
      } else if (mode === 'html') {
        setHtmlContent(editor.getHTML());
      }
    }
  }, [mode, editor]);

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    if (editor) {
      editor.commands.setContent(newHtml);
    }
    const markdown = turndownService.turndown(newHtml);
    setMarkdownContent(markdown);
    onChange(mode === 'markdown' ? markdown : newHtml);
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdownContent(newMarkdown);
    onChange(newMarkdown);
  };

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('h-8 w-8', isActive && 'bg-muted')}
      onClick={onClick}
    >
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
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {editable && !disabled && (
        <div className='flex flex-col items-start gap-1 border-b bg-muted/50 p-1'>
          <div className='flex gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn('gap-2', mode === 'rich-text' && 'bg-muted')}
              onClick={() => setMode('rich-text')}
            >
              <FileText className='h-4 w-4' />
              {t('rich_text')}
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn('gap-2', mode === 'markdown' && 'bg-muted')}
              onClick={() => setMode('markdown')}
            >
              <FileText className='h-4 w-4' />
              {t('markdown')}
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className={cn('gap-2', mode === 'html' && 'bg-muted')}
              onClick={() => setMode('html')}
            >
              <Code className='h-4 w-4' />
              {t('html')}
            </Button>
          </div>

          <div>
            {mode === 'rich-text' && (
              <>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  isActive={editor.isActive('bold')}
                >
                  <Bold className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  isActive={editor.isActive('italic')}
                >
                  <Italic className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  isActive={editor.isActive('underline')}
                >
                  <UnderlineIcon className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  isActive={editor.isActive('strike')}
                >
                  <Strikethrough className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={setLink}
                  isActive={editor.isActive('link')}
                >
                  <LinkIcon className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton onClick={addImage}>
                  <ImageIcon className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign('left').run()
                  }
                  isActive={editor.isActive({ textAlign: 'left' })}
                >
                  <AlignLeft className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign('center').run()
                  }
                  isActive={editor.isActive({ textAlign: 'center' })}
                >
                  <AlignCenter className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign('right').run()
                  }
                  isActive={editor.isActive({ textAlign: 'right' })}
                >
                  <AlignRight className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  isActive={editor.isActive('bulletList')}
                >
                  <List className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  isActive={editor.isActive('orderedList')}
                >
                  <ListOrdered className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  isActive={editor.isActive('blockquote')}
                >
                  <Quote className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().undo().run()}
                >
                  <Undo className='h-4 w-4' />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor.chain().focus().redo().run()}
                >
                  <Redo className='h-4 w-4' />
                </ToolbarButton>
              </>
            )}
          </div>
        </div>
      )}

      <div className='relative flex-1 overflow-hidden'>
        {mode === 'html' ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            className='absolute inset-0 w-full resize-none overflow-y-auto p-4 font-mono text-sm focus:outline-hidden'
            placeholder={t('html_placeholder')}
            disabled={disabled}
            readOnly={!editable || disabled}
          />
        ) : mode === 'markdown' ? (
          <textarea
            value={markdownContent}
            onChange={handleMarkdownChange}
            className='absolute inset-0 w-full resize-none overflow-y-auto p-4 font-mono text-sm focus:outline-hidden'
            placeholder={t('markdown_placeholder')}
            disabled={disabled}
            readOnly={!editable || disabled}
          />
        ) : (
          <div
            className={cn(
              'absolute inset-0 overflow-y-auto',
              editable && !disabled && mode === 'rich-text'
                ? 'cursor-text'
                : 'cursor-default select-text'
            )}
            onMouseDown={() => {
              if (editable && !disabled && mode === 'rich-text') {
                editor?.chain().focus().run();
              }
            }}
          >
            <EditorContent
              editor={editor}
              className='prose prose-sm dark:prose-invert max-w-none p-4'
            />
          </div>
        )}
      </div>
    </div>
  );
}
