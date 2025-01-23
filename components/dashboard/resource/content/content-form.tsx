import { Combobox } from '@/components/shared/combobox';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import type { ResourceContent } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

type FormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
  content?: ResourceContent | null;
  onSuccess?: () => void;
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
}

export function ContentForm({ content, onSuccess, onSubmit, isSubmitting }: ContentFormProps) {
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

  const { mutate: createContent, isPending: isCreating } = api.resource.createContent.useMutation({
    onSuccess: () => {
      toast.success('Content created successfully');
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateContent, isPending: isUpdating } = api.resource.updateContent.useMutation({
    onSuccess: () => {
      toast.success('Content updated successfully');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (content) {
      form.reset({
        title: content.title,
        description: content.description || '',
        content: content.content,
        tags: content.tags ? JSON.parse(content.tags) : [],
        visibility: content.visibility,
      });
    }
  }, [content, form]);

  const onSubmitForm = (data: FormValues) => {
    onSubmit(data);
  };

  const handleAddTag = (value: string) => {
    const currentTags = form.getValues('tags');
    if (value && !currentTags.includes(value.toLowerCase())) {
      form.setValue('tags', [...currentTags, value.toLowerCase()]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className='h-full space-y-4'>
        <div className='space-y-4'>
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
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='tags'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <div className='space-y-2'>
                    <Combobox
                      value=''
                      onChange={handleAddTag}
                      items={field.value}
                      placeholder='Add tags...'
                      searchPlaceholder='Search or add new tag...'
                      emptyText='No matching tags'
                      groupHeading='Existing Tags'
                      allowCustom
                    />
                    <div className='flex flex-wrap gap-2'>
                      {field.value.map((tag) => (
                        <Badge key={tag} variant='secondary' className='gap-1'>
                          {tag}
                          <button type='button' onClick={() => handleRemoveTag(tag)} className='ml-1 rounded-full outline-none hover:text-destructive'>
                            <X className='size-3' />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='visibility'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Public</FormLabel>
                  <div className='text-muted-foreground text-sm'>Make this content public to everyone</div>
                </div>
                <FormControl>
                  <Switch checked={field.value === 'PUBLIC'} onCheckedChange={(checked) => field.onChange(checked ? 'PUBLIC' : 'PRIVATE')} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className='h-[calc(100vh-450px)] rounded-lg border bg-background'>
          <FormField
            control={form.control}
            name='content'
            render={({ field }) => (
              <FormItem className='h-full'>
                <FormControl>
                  <ScrollArea className='h-full'>
                    <TipTapEditor content={field.value} onChange={field.onChange} className='border-none' />
                  </ScrollArea>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type='submit' disabled={isCreating || isUpdating}>
          {content ? 'Update' : 'Create'}
        </Button>
      </form>
    </Form>
  );
}
