'use client';

import { PageHeader } from '@/components/shared/page-header';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface Template {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  content: string;
  tags: string | null;
  visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function EmailsPage() {
  const t = useTranslations();

  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');

  const utils = api.useUtils();

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
      toast.success('HTML code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy HTML code');
    }
  };

  // Query to fetch all email templates
  const { data: templates, isLoading } = api.resource.getEmails.useQuery();

  // Mutation to create a new template
  const createMutation = api.resource.createEmail.useMutation({
    onSuccess: (newTemplate) => {
      toast.success(t('email_template_created_successfully'));
      utils.resource.getEmails.invalidate();
      if (newTemplate?.id) {
        router.push(`/dashboard/resource/emails/${newTemplate.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to delete a template
  const deleteMutation = api.resource.deleteEmail.useMutation({
    onSuccess: () => {
      toast.success(t('email_template_deleted_successfully'));
      utils.resource.getEmails.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedTemplate(null);
    setTitle('');
    setDescription('');
    setSubject('');
    setEditorContent('');
  };

  const handleSelectTemplate = (template: Template) => {
    router.push(`/dashboard/resource/emails/${template.id}`);
  };

  const handleSaveTemplate = async () => {
    if (!title || !subject || !editorContent) {
      toast.error('Please fill in all required fields');
      return;
    }

    const templateData = {
      title,
      description,
      subject,
      content: editorContent,
      visibility: 'PRIVATE' as const,
    };

    createMutation.mutate(templateData);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='container mx-auto flex h-full flex-col px-8 py-6'>
        <PageHeader title='Email Templates' description='Create and manage your email templates' />

        <div className='mt-8 grid flex-1 grid-cols-12 gap-8'>
          <div className='col-span-3'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='font-medium text-base text-neutral-700 dark:text-neutral-100'>Templates</h3>
              <Button onClick={resetForm} variant='outline' size='sm' className='h-8'>
                <Plus className='h-4 w-4' /> New
              </Button>
            </div>
            <div className='space-y-1'>
              {isLoading && (
                <div className='space-y-2 rounded-md bg-white/60 text-center'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                </div>
              )}
              {templates?.map((template) => (
                <button
                  type='button'
                  key={template.id}
                  className={cn(
                    'w-full cursor-pointer rounded-md border border-neutral-200 px-3 py-2 text-left transition-colors dark:border-neutral-800',
                    selectedTemplate?.id === template.id ? 'bg-white shadow-xs ring-1 ring-neutral-200 dark:ring-neutral-800' : 'hover:bg-white/60 dark:hover:bg-neutral-900/60'
                  )}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <span className='font-medium text-neutral-900 text-sm dark:text-neutral-100'>{template.title}</span>
                  {template.description && <p className='mt-1 line-clamp-2 text-neutral-500 text-xs dark:text-neutral-400'>{template.description}</p>}
                </button>
              ))}
              {templates && templates.length === 0 && (
                <div className='rounded-md bg-white/60 px-3 py-8 text-center'>
                  <p className='text-neutral-500 text-sm'>No templates yet</p>
                  <p className='text-neutral-400 text-xs'>Create your first template to get started</p>
                </div>
              )}
            </div>
          </div>

          <div className='col-span-9 flex flex-col'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='font-medium text-base text-neutral-700'>{selectedTemplate ? 'Edit Template' : 'New Template'}</h3>
              <div className='flex gap-2'>
                {selectedTemplate && (
                  <>
                    <Button onClick={handleCopyHtml} variant='outline' className='text-neutral-600 hover:bg-neutral-50'>
                      Copy HTML
                    </Button>
                    <Button onClick={handleDeleteTemplate} variant='outline' className='text-red-600 hover:bg-red-50'>
                      Delete
                    </Button>
                  </>
                )}
                <Button variant='outline' size='sm' onClick={handleSaveTemplate} className='h-8'>
                  {selectedTemplate ? 'Update' : 'Save'} Template
                </Button>
              </div>
            </div>

            <div className='flex flex-1 flex-col space-y-4'>
              <div>
                <Input placeholder='Template Title' value={title} onChange={(e) => setTitle(e.target.value)} className='mb-2' />
                <Textarea placeholder='Template Description (optional)' value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>

              <Input placeholder='Email Subject' value={subject} onChange={(e) => setSubject(e.target.value)} />

              <div className='min-h-0 flex-1'>
                <TipTapEditor content={editorContent} onChange={setEditorContent} placeholder='Write your email content here...' className='h-full' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
