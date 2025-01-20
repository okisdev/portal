import { TipTapEditor } from '@/components/shared/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

type FormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
}

export function ContentForm({ onSubmit, isSubmitting }: ContentFormProps) {
  const [keepCreating, setKeepCreating] = useState(false);

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

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
    if (!keepCreating) {
      form.reset();
    }
  };

  return (
    <div className='h-full'>
      <div className='mb-4'>
        <h2 className='font-medium text-xl'>New Content</h2>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
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
            <Button type='submit' disabled={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
