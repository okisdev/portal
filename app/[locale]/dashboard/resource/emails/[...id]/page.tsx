'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';
import { Editor } from '@maily-to/core';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [editorContent, setEditorContent] = useState('');

  const utils = api.useUtils();

  // Query to fetch the email template
  const { data: template, isLoading } = api.resource.getEmail.useQuery(id || '', {
    enabled: !!id,
  });

  // Mutation to update the template
  const updateMutation = api.resource.updateEmail.useMutation({
    onSuccess: () => {
      toast.success('Email template updated successfully');
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
      toast.success('Email template deleted successfully');
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
    if (!id || !title || !subject || !editorContent) {
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
          <h3 className='font-medium text-lg text-neutral-900'>Template not found</h3>
          <p className='mt-1 text-neutral-500'>The template you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push('/dashboard/resource/emails')} className='mt-4' variant='outline'>
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full'>
      <div className='container mx-auto px-8 py-6'>
        <div className='mb-6 flex items-center justify-between'>
          <PageHeader title='Edit Email Template' description='Make changes to your email template' />
          <div className='flex gap-2'>
            <Button onClick={() => router.push('/dashboard/resource/emails')} variant='outline'>
              Back
            </Button>
            <Button onClick={handleDeleteTemplate} variant='outline' className='text-red-600 hover:bg-red-50'>
              Delete
            </Button>
            <Button onClick={handleSaveTemplate} className='bg-neutral-900 text-white hover:bg-neutral-800'>
              Save Changes
            </Button>
          </div>
        </div>

        <div className='mt-8 space-y-4'>
          <div>
            <Input placeholder='Template Title' value={title} onChange={(e) => setTitle(e.target.value)} className='mb-2' />
            <Textarea placeholder='Template Description (optional)' value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <Input placeholder='Email Subject' value={subject} onChange={(e) => setSubject(e.target.value)} />

          <div className='flex h-[600px] flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200'>
            <div className='flex-1 overflow-y-auto'>
              <Editor
                contentHtml={editorContent}
                onUpdate={(editor) => {
                  setEditorContent(editor.getHTML());
                }}
                config={{
                  hasMenuBar: true,
                  spellCheck: true,
                  autofocus: 'end',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
