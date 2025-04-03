'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const statusSchema = z.object({
  values: z.array(z.string()),
});

const prioritySchema = z.object({
  values: z.array(z.string()),
});

const sourceSchema = z.object({
  values: z.array(z.string()),
});

type StatusFormValues = z.infer<typeof statusSchema>;
type PriorityFormValues = z.infer<typeof prioritySchema>;
type SourceFormValues = z.infer<typeof sourceSchema>;

export default function ManagementPage() {
  const t = useTranslations();
  const utils = api.useUtils();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

  const { data: statusConfig, isLoading: isStatusLoading } = api.site.getConfig.useQuery({ key: 'status' });
  const { data: priorityConfig, isLoading: isPriorityLoading } = api.site.getConfig.useQuery({ key: 'priority' });
  const { data: sourceConfig, isLoading: isSourceLoading } = api.site.getConfig.useQuery({ key: 'source' });

  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      values: statusConfig?.value ? JSON.parse(statusConfig.value) : [],
    },
  });

  const priorityForm = useForm<PriorityFormValues>({
    resolver: zodResolver(prioritySchema),
    defaultValues: {
      values: priorityConfig?.value ? JSON.parse(priorityConfig.value) : [],
    },
  });

  const sourceForm = useForm<SourceFormValues>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      values: sourceConfig?.value ? JSON.parse(sourceConfig.value) : [],
    },
  });

  const updateStatus = api.site.updateConfig.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'status' });
      setIsStatusDialogOpen(false);
      toast.success(t('status_updated_successfully'));
    },
  });

  const updatePriority = api.site.updateConfig.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'priority' });
      setIsPriorityDialogOpen(false);
      toast.success(t('priority_updated_successfully'));
    },
  });

  const updateSource = api.site.updateConfig.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'source' });
      setIsSourceDialogOpen(false);
      toast.success(t('source_updated_successfully'));
    },
  });

  const onSubmitStatus = (data: StatusFormValues) => {
    updateStatus.mutate({
      key: 'status',
      value: JSON.stringify(data.values),
      type: 'array',
    });
  };

  const onSubmitPriority = (data: PriorityFormValues) => {
    updatePriority.mutate({
      key: 'priority',
      value: JSON.stringify(data.values),
      type: 'array',
    });
  };

  const onSubmitSource = (data: SourceFormValues) => {
    updateSource.mutate({
      key: 'source',
      value: JSON.stringify(data.values),
      type: 'array',
    });
  };

  return (
    <div className='space-y-4 p-4'>
      <PageHeader title={t('management')} description={t('management_description')} />

      <Tabs defaultValue='status' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='status'>{t('status')}</TabsTrigger>
          <TabsTrigger value='priority'>{t('priority')}</TabsTrigger>
          <TabsTrigger value='source'>{t('source')}</TabsTrigger>
        </TabsList>

        <TabsContent value='status'>
          <Card>
            <CardHeader>
              <CardTitle>{t('status_management')}</CardTitle>
              <Button onClick={() => setIsStatusDialogOpen(true)}>{t('edit_status')}</Button>
            </CardHeader>
            <CardContent>
              {isStatusLoading ? (
                <div>{t('loading')}</div>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {statusConfig?.value &&
                    JSON.parse(statusConfig.value).map((status: string) => (
                      <div key={status} className='rounded-full bg-primary/10 px-3 py-1 text-sm'>
                        {status}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='priority'>
          <Card>
            <CardHeader>
              <CardTitle>{t('priority_management')}</CardTitle>
              <Button onClick={() => setIsPriorityDialogOpen(true)}>{t('edit_priority')}</Button>
            </CardHeader>
            <CardContent>
              {isPriorityLoading ? (
                <div>{t('loading')}</div>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {priorityConfig?.value &&
                    JSON.parse(priorityConfig.value).map((priority: string) => (
                      <div key={priority} className='rounded-full bg-primary/10 px-3 py-1 text-sm'>
                        {priority}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='source'>
          <Card>
            <CardHeader>
              <CardTitle>{t('source_management')}</CardTitle>
              <Button onClick={() => setIsSourceDialogOpen(true)}>{t('edit_source')}</Button>
            </CardHeader>
            <CardContent>
              {isSourceLoading ? (
                <div>{t('loading')}</div>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {sourceConfig?.value &&
                    JSON.parse(sourceConfig.value).map((source: string) => (
                      <div key={source} className='rounded-full bg-primary/10 px-3 py-1 text-sm'>
                        {source}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_status')}</DialogTitle>
          </DialogHeader>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onSubmitStatus)} className='space-y-4'>
              <FormField
                control={statusForm.control}
                name='values'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status_values')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value.join(', ')}
                        onChange={(e) => field.onChange(e.target.value.split(',').map((v) => v.trim()))}
                        placeholder='Enter status values separated by commas'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='submit'>{t('save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPriorityDialogOpen} onOpenChange={setIsPriorityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_priority')}</DialogTitle>
          </DialogHeader>
          <Form {...priorityForm}>
            <form onSubmit={priorityForm.handleSubmit(onSubmitPriority)} className='space-y-4'>
              <FormField
                control={priorityForm.control}
                name='values'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('priority_values')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value.join(', ')}
                        onChange={(e) => field.onChange(e.target.value.split(',').map((v) => v.trim()))}
                        placeholder='Enter priority values separated by commas'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='submit'>{t('save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_source')}</DialogTitle>
          </DialogHeader>
          <Form {...sourceForm}>
            <form onSubmit={sourceForm.handleSubmit(onSubmitSource)} className='space-y-4'>
              <FormField
                control={sourceForm.control}
                name='values'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('source_values')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value.join(', ')}
                        onChange={(e) => field.onChange(e.target.value.split(',').map((v) => v.trim()))}
                        placeholder='Enter source values separated by commas'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='submit'>{t('save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
