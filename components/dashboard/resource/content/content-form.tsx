import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Combobox } from '@/components/shared/combobox';
import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { contentTags } from '@/data/data';
import type { ResourceContent } from '@/lib/schema';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

type FormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
  content?: ResourceContent | null;
  onSuccess?: () => void;
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
}

export function ContentForm({
  content,
  onSuccess,
  onSubmit,
  isSubmitting,
}: ContentFormProps) {
  const t = useTranslations();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      tags: '',
      visibility: 'PRIVATE',
    },
  });

  useEffect(() => {
    if (content) {
      form.reset({
        title: content.title,
        description: content.description || '',
        content: content.content,
        tags: content.tags || '',
        visibility: content.visibility,
      });
    }
  }, [content, form]);

  const onSubmitForm = (data: FormValues) => {
    onSubmit(data);
    if (!content) {
      form.reset({
        title: '',
        description: '',
        content: '',
        tags: '',
        visibility: 'PRIVATE',
      });
    }
    onSuccess?.();
  };

  const handleAddTag = (value: string) => {
    const tags = form.getValues('tags');
    const currentTags = tags ? (JSON.parse(tags) as string[]) : [];
    if (value && !currentTags.includes(value.toLowerCase())) {
      const newTags = [...currentTags, value.toLowerCase()];
      form.setValue('tags', JSON.stringify(newTags));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tags = form.getValues('tags');
    const currentTags = tags ? (JSON.parse(tags) as string[]) : [];
    const newTags = currentTags.filter((tag) => tag !== tagToRemove);
    form.setValue('tags', newTags.length > 0 ? JSON.stringify(newTags) : '');
  };

  return (
    <Form {...form}>
      <form
        className='flex h-full flex-col'
        onSubmit={form.handleSubmit(onSubmitForm)}
      >
        <div className='space-y-4 border-b bg-background p-4'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-muted-foreground text-sm'>
                  {t('title')}
                </FormLabel>
                <FormControl>
                  <Input {...field} className='h-9 font-medium text-lg' />
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
                <FormLabel className='text-muted-foreground text-sm'>
                  {t('description')}
                </FormLabel>
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
                <FormLabel className='text-muted-foreground text-sm'>
                  {t('tags')}
                </FormLabel>
                <FormControl>
                  <div className='space-y-2'>
                    <Combobox
                      allowCustom
                      emptyText={t('no_matching_tags')}
                      groupHeading={t('existing_tags')}
                      items={contentTags}
                      onChange={handleAddTag}
                      placeholder={t('add_tags')}
                      searchPlaceholder={t('tags_search_placeholder')}
                      value=''
                    />
                    <div className='flex flex-wrap gap-1.5'>
                      {(field.value
                        ? (JSON.parse(field.value) as string[])
                        : []
                      ).map((tag: string) => (
                        <Badge className='gap-1' key={tag} variant='secondary'>
                          {tag}
                          <button
                            className='ml-1 rounded-full outline-hidden hover:text-destructive'
                            onClick={() => handleRemoveTag(tag)}
                            type='button'
                          >
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
              <FormItem className='flex flex-row items-center space-x-2'>
                <FormControl>
                  <Switch
                    checked={field.value === 'PUBLIC'}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? 'PUBLIC' : 'PRIVATE')
                    }
                  />
                </FormControl>
                <FormLabel className='text-sm'>
                  {t('public_description')}
                </FormLabel>
              </FormItem>
            )}
          />
        </div>
        <div className='flex-1'>
          <FormField
            control={form.control}
            name='content'
            render={({ field }) => (
              <FormItem className='h-full'>
                <FormControl>
                  <TipTapEditor
                    className='h-full'
                    content={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='border-t bg-background p-4'>
          <Button className='w-full' disabled={isSubmitting} type='submit'>
            {content ? t('update') : t('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
