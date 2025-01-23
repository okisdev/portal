'use client';

import { ContentEditor } from '@/components/dashboard/resource/content/content-editor';
import { ContentForm } from '@/components/dashboard/resource/content/content-form';
import { ContentSideList } from '@/components/dashboard/resource/content/side-list';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import type { ResourceContent } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ContentPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const utils = api.useUtils();

  const t = useTranslations();

  const [currentContent, setCurrentContent] = useState<ResourceContent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: contents, isLoading: contentsLoading } = api.resource.getContents.useQuery();
  const { data: content, isLoading: contentLoading } = api.resource.getContent.useQuery(id || '', {
    enabled: !!id,
  });

  const createContent = api.resource.createContent.useMutation({
    onSuccess: () => {
      toast.success('Content created successfully');
      router.push('/dashboard/resource/content');
      utils.resource.getContents.invalidate();
    },
    onError: (error) => {
      toast.error('Error creating content', {
        description: error.message,
      });
    },
  });

  const updateContent = api.resource.updateContent.useMutation({
    onSuccess: () => {
      toast.success('Content updated successfully');
      utils.resource.getContents.invalidate();
    },
    onError: (error) => {
      toast.error('Error updating content', {
        description: error.message,
      });
    },
  });

  const deleteContent = api.resource.deleteContent.useMutation({
    onSuccess: () => {
      toast.success('Content deleted successfully');
      setCurrentContent(null);
      router.push('/dashboard/resource/content');
      utils.resource.getContents.invalidate();
    },
    onError: (error) => {
      toast.error('Error deleting content', {
        description: error.message,
      });
    },
  });

  const handleDelete = () => {
    if (currentContent) {
      deleteContent.mutate(currentContent.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpdate = (data: Partial<ResourceContent>) => {
    if (currentContent) {
      const updatedData = {
        title: data.title || currentContent.title,
        content: data.content || currentContent.content,
        description: data.description === undefined ? currentContent.description || undefined : data.description || undefined,
        visibility: data.visibility || currentContent.visibility,
        tags: data.tags || (currentContent.tags ? JSON.parse(currentContent.tags) : []),
      };

      updateContent.mutate({
        id: currentContent.id,
        data: updatedData,
      });
    }
  };

  const handleNewContent = () => {
    router.push('/dashboard/resource/content');
    setCurrentContent(null);
  };

  useEffect(() => {
    if (content) {
      setCurrentContent(content.resourceContent);
    }
  }, [content]);

  return (
    <div className='flex h-full'>
      <ContentSideList contents={contents} currentContent={currentContent} isLoading={contentsLoading} onNewContent={handleNewContent} />

      <div className='flex-1 p-4'>
        {id ? (
          <ContentEditor content={currentContent} onUpdate={handleUpdate} onDelete={() => setIsDeleteDialogOpen(true)} isLoading={contentLoading} />
        ) : (
          <ContentForm onSubmit={createContent.mutate} isSubmitting={createContent.isPending} />
        )}
      </div>

      <ActionAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title='Delete Content'
        description='Are you sure you want to delete this content? This action cannot be undone.'
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />
    </div>
  );
}
