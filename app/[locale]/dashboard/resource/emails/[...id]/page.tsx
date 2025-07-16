'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

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

  // Query to fetch the email template
  const { data: template, isLoading } = api.resource.getEmail.useQuery(
    id || '',
    {
      enabled: !!id,
    }
  );

  // Mutation to update the template
  const updateMutation = api.resource.updateEmail.useMutation({
    onSuccess: () => {
      toast.success(t('email_template_updated_successfully'));
      if (id) {
        utils.resource.getEmail.invalidate(id);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to delete the template
  const deleteMutation = api.resource.deleteEmail.useMutation({
    onSuccess: () => {
      toast.success(t('email_template_deleted_successfully'));
      router.push('/dashboard/resource/emails');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description || '');
      setSubject(template.subject);
      setEditorContent(template.content);
    }
  }, [template]);

  const handleSaveTemplate = async () => {
    if (!(id && title && subject && editorContent)) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateMutation.mutate({
      id,
      data: {
        title,
        description,
        subject,
        content: editorContent,
        visibility: 'PRIVATE' as const,
      },
    });
  };

  const handleDeleteTemplate = async () => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-8 py-6'>
        <div className='animate-pulse'>
          <div className='h-8 w-1/4 rounded bg-neutral-200' />
          <div className='mt-4 h-4 w-1/3 rounded bg-neutral-200' />
          <div className='mt-8 h-[600px] rounded bg-neutral-200' />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className='container mx-auto px-8 py-6'>
        <div className='text-center'>
          <h3 className='font-medium text-lg text-neutral-900'>
            Template not found
          </h3>
          <p className='mt-1 text-neutral-500'>
            The template you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            className='mt-4'
            onClick={() => router.push('/dashboard/resource/emails')}
            variant='outline'
          >
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='container mx-auto flex h-full flex-col px-8 py-6'>
        <div className='mb-6 flex items-center justify-between'>
          <PageHeader
            description='Make changes to your email template'
            title='Edit Email Template'
          />
          <div className='flex gap-2'>
            <Button
              onClick={() => router.push('/dashboard/resource/emails')}
              variant='outline'
            >
              {t('back')}
            </Button>
            <Button
              className='text-neutral-600 hover:bg-neutral-50'
              onClick={handleCopyHtml}
              variant='outline'
            >
              {t('copy_html')}
            </Button>
            <Button
              className='text-red-600 hover:bg-red-50'
              onClick={handleDeleteTemplate}
              variant='outline'
            >
              {t('delete')}
            </Button>
            <Button
              className='bg-neutral-900 text-white hover:bg-neutral-800'
              onClick={handleSaveTemplate}
            >
              {t('save_changes')}
            </Button>
          </div>
        </div>

        <div className='flex flex-1 flex-col space-y-4'>
          <div>
            <Input
              className='mb-2'
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Template Title'
              value={title}
            />
            <Textarea
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Template Description (optional)'
              rows={2}
              value={description}
            />
          </div>

          <Input
            onChange={(e) => setSubject(e.target.value)}
            placeholder='Email Subject'
            value={subject}
          />

          <div className='min-h-0 flex-1'>
            <TipTapEditor
              className='h-full'
              content={editorContent}
              onChange={setEditorContent}
              placeholder='Write your email content here...'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
