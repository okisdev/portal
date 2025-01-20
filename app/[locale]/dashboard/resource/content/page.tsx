'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { ResourceContent } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, PlusCircle, Save, Search, Trash } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContentPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [currentContent, setCurrentContent] = useState<ResourceContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keepCreating, setKeepCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      tags: [],
      visibility: 'PRIVATE',
    },
  });

  const { data: contents, isLoading: contentsLoading } = api.resource.getContents.useQuery();

  const { data: content, isLoading: contentLoading } = api.resource.getContent.useQuery(id || '', {
    enabled: !!id,
  });

  const createContent = api.resource.createContent.useMutation({
    onSuccess: () => {
      toast.success('Content created successfully');
      form.reset();
      if (!keepCreating) {
        setIsEditing(false);
      }
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
      form.reset();
      setIsEditing(false);
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
    },
    onError: (error) => {
      toast.error('Error deleting content', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (currentContent && isEditing) {
      updateContent.mutate({
        id: currentContent.id,
        data,
      });
    } else {
      createContent.mutate(data);
    }
  };

  useEffect(() => {
    if (content) {
      setCurrentContent(content.resourceContent);

      if (isEditing) {
        form.reset({
          title: content.resourceContent.title,
          description: content.resourceContent.description || '',
          content: content.resourceContent.content,
          tags: content.resourceContent.tags ? JSON.parse(content.resourceContent.tags) : [],
          visibility: content.resourceContent.visibility,
        });
      }
    }
  }, [content, isEditing, form]);

  const handleDelete = () => {
    if (currentContent) {
      deleteContent.mutate(currentContent.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className='flex h-full'>
      <div className='w-1/3 border-r p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <PageHeader title='Contents' />
          <Button
            variant='outline'
            className='h-8'
            onClick={() => {
              router.push('/dashboard/resource/content');
              setCurrentContent(null);
              setIsEditing(false);
              form.reset();
            }}
          >
            <PlusCircle className='h-4 w-4' />
            New
          </Button>
        </div>

        <div className='relative mb-4'>
          <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search contents...' className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <ScrollArea className='h-[calc(100vh-200px)]'>
          {contentsLoading ? (
            <div className='flex h-full flex-col items-center justify-center space-y-2'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-20 w-full' />
            </div>
          ) : (
            contents?.map((item) => (
              <button
                type='button'
                key={item.resourceContent.id}
                className={`mb-2 w-full cursor-pointer rounded-lg p-4 text-left transition-colors hover:bg-accent/50 ${currentContent?.id === item.resourceContent.id ? 'bg-accent' : ''}`}
                onClick={() => {
                  router.push(`?id=${item.resourceContent.id}`);
                }}
              >
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold'>{item.resourceContent.title}</h3>
                  <Badge variant={item.resourceContent.visibility === 'PUBLIC' ? 'default' : item.resourceContent.visibility === 'SHARED' ? 'secondary' : 'outline'}>
                    {item.resourceContent.visibility.toLowerCase()}
                  </Badge>
                </div>
                <p className='text-muted-foreground text-sm'>{item.resourceContent.description}</p>
                <p className='mt-2 text-muted-foreground text-xs'>Created: {new Date(item.resourceContent.createdAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      <div className='flex-1 p-4'>
        {id ? (
          <div className='h-full space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex flex-col space-y-0.5'>
                {contentLoading ? (
                  <>
                    <Skeleton className='h-4 w-36' />
                    <Skeleton className='h-4 w-36' />
                  </>
                ) : (
                  <>
                    <h2 className='font-medium'>{currentContent?.title}</h2>
                    <p className='text-muted-foreground text-sm'>{currentContent?.description}</p>
                  </>
                )}
              </div>
              <div className='space-x-2'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='outline' size='icon' onClick={() => setIsEditing(true)}>
                      <Edit className='h-4 w-4' />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
                    <DialogHeader>
                      <DialogTitle>Edit Content</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                        <FormField
                          control={form.control}
                          name='title'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='description'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='content'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <FormControl>
                                <TipTapEditor
                                  content={currentContent?.content ?? ''}
                                  onChange={(value) => {
                                    if (currentContent) {
                                      setCurrentContent({
                                        ...currentContent,
                                        content: value,
                                      });
                                      field.onChange(value);
                                    }
                                  }}
                                  editable={true}
                                  className='border-none'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name='visibility'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Visibility</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select visibility' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='PRIVATE'>Private</SelectItem>
                                  <SelectItem value='SHARED'>Shared</SelectItem>
                                  <SelectItem value='PUBLIC'>Public</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type='submit' disabled={updateContent.isPending}>
                            Update
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => {
                    if (currentContent) {
                      updateContent.mutate({
                        id: currentContent.id,
                        data: {
                          content: currentContent.content,
                        },
                      });
                    }
                  }}
                >
                  <Save className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon' onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <div className='h-[calc(100vh-150px)] rounded-lg border bg-background'>
              <div className='flex-1'>
                <ScrollArea className='h-full'>
                  <TipTapEditor
                    content={currentContent?.content ?? ''}
                    onChange={(value) => {
                      if (currentContent) {
                        setCurrentContent({
                          ...currentContent,
                          content: value,
                        });
                      }
                    }}
                    editable={true}
                    className='border-none'
                  />
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : (
          <div className='h-full'>
            <div className='mb-4'>
              <h2 className='font-medium text-xl'>New Content</h2>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='content'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <TipTapEditor content={field.value} onChange={field.onChange} className='min-h-[400px]' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='visibility'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select visibility' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='PRIVATE'>Private</SelectItem>
                          <SelectItem value='SHARED'>Shared</SelectItem>
                          <SelectItem value='PUBLIC'>Public</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Switch id='keep-creating' checked={keepCreating} onCheckedChange={setKeepCreating} />
                    <Label htmlFor='keep-creating'>Keep creating</Label>
                  </div>
                  <Button type='submit' disabled={createContent.isPending}>
                    Create
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>

      <ActionAlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title='Delete Content'
        description='Are you sure you want to delete this content? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
      />
    </div>
  );
}
