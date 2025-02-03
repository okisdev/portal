'use client';

import { ContentEditor } from '@/components/dashboard/resource/content/content-editor';
import { ContentForm } from '@/components/dashboard/resource/content/content-form';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ResourceContent } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Eye, Send } from 'lucide-react';
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
  const { data: content, isLoading: contentLoading } = api.resource.getContent.useQuery({ id: id || '' }, { enabled: !!id });

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
        tags: data.tags || undefined,
      };

      updateContent.mutate(
        {
          id: currentContent.id,
          data: updatedData,
        },
        {
          onSuccess: () => {
            utils.resource.getContents.invalidate();
            utils.resource.getContent.invalidate({ id: currentContent.id });
          },
        }
      );
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
      <div className='flex w-80 flex-col border-r bg-muted/10'>
        <div className='border-b bg-background p-4'>
          <PageHeader
            title={t('content')}
            right={
              <button
                type='button'
                onClick={handleNewContent}
                className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
              >
                {t('new')}
              </button>
            }
          />
        </div>

        <div className='flex-1 overflow-y-auto p-3'>
          <div className='space-y-2'>
            {contentsLoading && (
              <>
                <Skeleton className='h-24' />
                <Skeleton className='h-24' />
                <Skeleton className='h-24' />
              </>
            )}
            {contents && contents.length === 0 && (
              <div className='flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm'>{t('no_contents_found')}</div>
            )}
            {contents?.map((item) => {
              const tags = item.resourceContent.tags ? JSON.parse(item.resourceContent.tags) : [];
              return (
                <button
                  key={item.resourceContent.id}
                  type='button'
                  onClick={() => router.push(`/dashboard/resource/content?id=${item.resourceContent.id}`)}
                  className={`group w-full space-y-2 rounded-lg border bg-background p-3 text-left transition-all hover:border-primary/20 hover:shadow-sm ${
                    currentContent?.id === item.resourceContent.id ? 'border-primary/40 shadow-sm' : ''
                  }`}
                >
                  <div>
                    <h3 className='line-clamp-1 font-medium text-sm group-hover:text-primary'>{item.resourceContent.title}</h3>
                    {item.resourceContent.description && <p className='line-clamp-2 text-muted-foreground text-xs'>{item.resourceContent.description}</p>}
                  </div>

                  {tags.length > 0 && (
                    <div className='flex flex-wrap items-center gap-1.5'>
                      {tags.map((tag: string) => (
                        <Badge key={tag} variant='secondary' className='text-xs'>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className='flex items-center gap-4 text-muted-foreground text-xs'>
                    <div className='flex items-center gap-1.5'>
                      <Clock className='size-3' />
                      {formatDistanceToNow(new Date(item.resourceContent.updatedAt), { addSuffix: true })}
                    </div>

                    <div className='flex items-center gap-1.5'>
                      <Eye className='size-3' />
                      {item.resourceContent.visibility.toLowerCase()}
                    </div>

                    <div className='flex items-center gap-1.5'>
                      <Send className='size-3' />
                      {item.sendCount || 0}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className='flex-1'>
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
        title={t('delete_content')}
        description={t('delete_content_description')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
      />
    </div>
  );
}
