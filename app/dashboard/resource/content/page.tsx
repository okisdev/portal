'use client';

import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Eye, PlusCircle, Search, Share2, Trash } from 'lucide-react';
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

interface Content {
  id: string;
  title: string;
  description: string | null;
  content: string;
  tags: string | null;
  visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ContentPage() {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
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

  // Queries
  const contentsQuery = api.resource.getContents.useQuery(
    {
      search: searchQuery || undefined,
    },
    {
      enabled: true,
    }
  );

  // Mutations
  const createContent = api.resource.createContent.useMutation({
    onSuccess: () => {
      toast.success('Content created successfully');
      form.reset();
      if (!keepCreating) {
        setIsEditing(false);
      }
      contentsQuery.refetch();
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
      contentsQuery.refetch();
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
      setSelectedContent(null);
      contentsQuery.refetch();
    },
    onError: (error) => {
      toast.error('Error deleting content', {
        description: error.message,
      });
    },
  });

  // Form handlers
  const onSubmit = (data: FormValues) => {
    if (selectedContent && isEditing) {
      updateContent.mutate({
        id: selectedContent.id,
        data,
      });
    } else {
      createContent.mutate(data);
    }
  };

  // Effect to populate form when editing
  useEffect(() => {
    if (selectedContent && isEditing) {
      form.reset({
        title: selectedContent.title,
        description: selectedContent.description || '',
        content: selectedContent.content,
        tags: selectedContent.tags ? JSON.parse(selectedContent.tags) : [],
        visibility: selectedContent.visibility,
      });
    }
  }, [selectedContent, isEditing, form]);

  const handleDelete = () => {
    if (selectedContent) {
      deleteContent.mutate(selectedContent.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className='flex h-full'>
      <div className='w-1/3 border-r p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <PageHeader title='Contents' />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                className='h-8'
                onClick={() => {
                  setSelectedContent(null);
                  setIsEditing(false);
                  form.reset();
                }}
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                New Content
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Content' : 'New Content'}</DialogTitle>
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
                          <Textarea {...field} rows={10} />
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
                  <DialogFooter className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      {!isEditing && (
                        <div className='flex items-center space-x-2'>
                          <Switch id='keep-creating' checked={keepCreating} onCheckedChange={setKeepCreating} />
                          <Label htmlFor='keep-creating'>Keep creating</Label>
                        </div>
                      )}
                    </div>
                    <Button type='submit' disabled={createContent.isPending || updateContent.isPending}>
                      {isEditing ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className='relative mb-4'>
          <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search contents...' className='pl-10' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <ScrollArea className='h-[calc(100vh-200px)]'>
          {contentsQuery.data?.map((item) => (
            <Card
              key={item.resourceContent.id}
              className={`mb-2 cursor-pointer hover:bg-accent ${selectedContent?.id === item.resourceContent.id ? 'border-primary' : ''}`}
              onClick={() => setSelectedContent(item.resourceContent)}
            >
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold'>{item.resourceContent.title}</h3>
                  <Badge variant={item.resourceContent.visibility === 'PUBLIC' ? 'default' : item.resourceContent.visibility === 'SHARED' ? 'secondary' : 'outline'}>
                    {item.resourceContent.visibility.toLowerCase()}
                  </Badge>
                </div>
                <p className='text-muted-foreground text-sm'>{item.resourceContent.description}</p>
                <p className='mt-2 text-muted-foreground text-xs'>Created: {new Date(item.resourceContent.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </div>

      <div className='flex-1 p-4'>
        {selectedContent ? (
          <div className='h-full'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='font-bold text-2xl'>{selectedContent.title}</h2>
              <div className='space-x-2'>
                <Button variant='outline' size='icon'>
                  <Eye className='h-4 w-4' />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='outline' size='icon' onClick={() => setIsEditing(true)}>
                      <Edit className='h-4 w-4' />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='sm:max-w-[600px]'>
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
                                <Textarea {...field} rows={10} />
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
                <Button variant='outline' size='icon' onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon'>
                  <Share2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <Card className='h-[calc(100vh-200px)]'>
              <CardContent className='p-4'>
                <ScrollArea className='h-full'>
                  <div className='prose max-w-none'>
                    <p className='mb-4 text-muted-foreground'>{selectedContent.description}</p>
                    <pre className='rounded-lg bg-muted p-4'>{selectedContent.content}</pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='flex h-full items-center justify-center text-muted-foreground'>Select a content to preview</div>
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
