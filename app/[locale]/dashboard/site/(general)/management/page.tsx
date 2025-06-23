'use client';

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, Pencil, Plus, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { randomColor } from '@/utils/color';
import { api } from '@/utils/trpc/client';

const addSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  color: z.string().optional(),
});

type AddFormValues = z.infer<typeof addSchema>;

interface SortableItemProps {
  item: { value: string; color: string };
  type: 'status' | 'priority' | 'source';
  onEdit: (
    item: { value: string; color: string },
    type: 'status' | 'priority' | 'source'
  ) => void;
  onRemove: (value: string) => void;
}

function SortableItem({
  item,
  type,
  onEdit,
  onRemove,
  index,
}: SortableItemProps & { index: number }) {
  const t = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.value });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex cursor-grab items-center justify-between rounded-lg border bg-card p-3 text-sm shadow-sm transition-all duration-200 active:cursor-grabbing',
        isDragging ? 'shadow-md ring-1 ring-primary/50' : 'hover:shadow-md'
      )}
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs'>
          {index + 1}
        </div>
        <div className='flex items-center gap-2'>
          <div
            className='h-3 w-3 rounded-full'
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <div className='-space-x-1 flex opacity-50 transition-opacity group-hover:opacity-100'>
          <div className='h-4 w-4 rounded-full bg-muted' />
          <div className='h-4 w-4 rounded-full bg-muted' />
          <div className='h-4 w-4 rounded-full bg-muted' />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6 opacity-0 group-hover:opacity-100'
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(item, type)}>
              <Pencil className='mr-2 h-4 w-4' />
              {t('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRemove(item.value)}
              className='text-destructive'
            >
              <Trash className='mr-2 h-4 w-4' />
              {t('remove')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function DragOverlayItem({
  item,
  index,
}: {
  item: { value: string; color: string };
  index: number;
}) {
  return (
    <div className='flex items-center justify-between rounded-lg border bg-card p-3 text-sm shadow-md ring-1 ring-primary/50'>
      <div className='flex items-center gap-3'>
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs'>
          {index + 1}
        </div>
        <div className='flex items-center gap-2'>
          <div
            className='h-3 w-3 rounded-full'
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <div className='-space-x-1 flex opacity-50'>
          <div className='h-4 w-4 rounded-full bg-muted' />
          <div className='h-4 w-4 rounded-full bg-muted' />
          <div className='h-4 w-4 rounded-full bg-muted' />
        </div>
      </div>
    </div>
  );
}

export default function ManagementPage() {
  const t = useTranslations();
  const utils = api.useUtils();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    value: string;
    color: string;
    type: 'status' | 'priority' | 'source';
  } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<{
    value: string;
    color: string;
  } | null>(null);

  const { data: statusConfig, isLoading: isStatusLoading } =
    api.site.getConfig.useQuery({ key: 'status' });
  const { data: priorityConfig, isLoading: isPriorityLoading } =
    api.site.getConfig.useQuery({ key: 'priority' });
  const { data: sourceConfig, isLoading: isSourceLoading } =
    api.site.getConfig.useQuery({ key: 'source' });

  const statusForm = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      value: '',
      color: randomColor(),
    },
  });

  const priorityForm = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      value: '',
      color: randomColor(),
    },
  });

  const sourceForm = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      value: '',
      color: randomColor(),
    },
  });

  const addStatus = api.site.addStatus.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'status' });
      setIsStatusDialogOpen(false);
      setEditingItem(null);
      statusForm.reset({ value: '', color: randomColor() });
      toast.success(t('status_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addPriority = api.site.addPriority.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'priority' });
      setIsPriorityDialogOpen(false);
      setEditingItem(null);
      priorityForm.reset({ value: '', color: randomColor() });
      toast.success(t('priority_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addSource = api.site.addSource.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'source' });
      setIsSourceDialogOpen(false);
      setEditingItem(null);
      sourceForm.reset({ value: '', color: randomColor() });
      toast.success(t('source_added_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatus = api.site.updateStatus.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'status' });
      setIsStatusDialogOpen(false);
      setEditingItem(null);
      statusForm.reset({ value: '', color: randomColor() });
      toast.success(t('status_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePriority = api.site.updatePriority.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'priority' });
      setIsPriorityDialogOpen(false);
      setEditingItem(null);
      priorityForm.reset({ value: '', color: randomColor() });
      toast.success(t('priority_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateSource = api.site.updateSource.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'source' });
      setIsSourceDialogOpen(false);
      setEditingItem(null);
      sourceForm.reset({ value: '', color: randomColor() });
      toast.success(t('source_updated_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeStatus = api.site.removeStatus.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'status' });
      toast.success(t('status_removed_successfully'));
    },
  });

  const removePriority = api.site.removePriority.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'priority' });
      toast.success(t('priority_removed_successfully'));
    },
  });

  const removeSource = api.site.removeSource.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'source' });
      toast.success(t('source_removed_successfully'));
    },
  });

  const reorderStatus = api.site.reorderStatus.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'status' });
      toast.success(t('status_reordered_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reorderPriority = api.site.reorderPriority.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'priority' });
      toast.success(t('priority_reordered_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reorderSource = api.site.reorderSource.useMutation({
    onSuccess: () => {
      utils.site.getConfig.invalidate({ key: 'source' });
      toast.success(t('source_reordered_successfully'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmitStatus = (data: AddFormValues) => {
    if (editingItem) {
      updateStatus.mutate({
        oldValue: editingItem.value,
        newValue: data.value,
        color: data.color || randomColor(),
      });
    } else {
      addStatus.mutate({
        value: data.value,
        color: data.color || randomColor(),
      });
    }
  };

  const onSubmitPriority = (data: AddFormValues) => {
    if (editingItem) {
      updatePriority.mutate({
        oldValue: editingItem.value,
        newValue: data.value,
        color: data.color || randomColor(),
      });
    } else {
      addPriority.mutate({
        value: data.value,
        color: data.color || randomColor(),
      });
    }
  };

  const onSubmitSource = (data: AddFormValues) => {
    if (editingItem) {
      updateSource.mutate({
        oldValue: editingItem.value,
        newValue: data.value,
        color: data.color || randomColor(),
      });
    } else {
      addSource.mutate({
        value: data.value,
        color: data.color || randomColor(),
      });
    }
  };

  const handleEdit = (
    item: { value: string; color: string },
    type: 'status' | 'priority' | 'source'
  ) => {
    setEditingItem({ ...item, type });
    switch (type) {
      case 'status':
        statusForm.reset({ value: item.value, color: item.color });
        setIsStatusDialogOpen(true);
        break;
      case 'priority':
        priorityForm.reset({ value: item.value, color: item.color });
        setIsPriorityDialogOpen(true);
        break;
      case 'source':
        sourceForm.reset({ value: item.value, color: item.color });
        setIsSourceDialogOpen(true);
        break;
    }
  };

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (
    event: DragStartEvent,
    values: { value: string; color: string }[]
  ) => {
    const { active } = event;
    setActiveId(active.id as string);
    const draggedItem = values.find((item) => item.value === active.id);
    if (draggedItem) {
      setActiveItem(draggedItem);
    }
  };

  const handleDragEnd = (
    event: DragEndEvent,
    type: 'status' | 'priority' | 'source',
    values: { value: string; color: string }[]
  ) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over || active.id === over.id) return;

    const oldIndex = values.findIndex((item) => item.value === active.id);
    const newIndex = values.findIndex((item) => item.value === over.id);

    const newValues = arrayMove(values, oldIndex, newIndex);

    // Update the order in the database
    switch (type) {
      case 'status':
        reorderStatus.mutate({ values: newValues });
        break;
      case 'priority':
        reorderPriority.mutate({ values: newValues });
        break;
      case 'source':
        reorderSource.mutate({ values: newValues });
        break;
    }
  };

  const renderValues = (
    values: { value: string; color: string }[] | undefined,
    isLoading: boolean,
    onRemove: (value: string) => void,
    type: 'status' | 'priority' | 'source'
  ) => {
    if (isLoading) {
      return <div className='text-muted-foreground'>{t('loading')}</div>;
    }

    if (!values || values.length === 0) {
      return <div className='text-muted-foreground'>{t('no_values')}</div>;
    }

    return (
      <DndContext
        sensors={sensors}
        onDragStart={(event) => handleDragStart(event, values)}
        onDragEnd={(event) => handleDragEnd(event, type, values)}
      >
        <div className='space-y-4'>
          <div className='flex items-center justify-between text-muted-foreground text-sm'>
            <span>{t('drag_to_reorder')}</span>
            <span>{t('total_items', { count: values.length })}</span>
          </div>
          <SortableContext
            items={values.map((item) => item.value)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-2'>
              {values.map((item, index) => (
                <SortableItem
                  key={item.value}
                  item={item}
                  type={type}
                  onEdit={handleEdit}
                  onRemove={onRemove}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </div>
        <DragOverlay>
          {activeItem ? (
            <DragOverlayItem
              item={activeItem}
              index={values.findIndex((item) => item.value === activeId)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
    <div className='container mx-auto space-y-4 p-4'>
      <PageHeader
        title={t('management')}
        description={t('management_description')}
      />

      <Tabs defaultValue='status' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='status'>{t('status')}</TabsTrigger>
          <TabsTrigger value='priority'>{t('priority')}</TabsTrigger>
          <TabsTrigger value='source'>{t('source')}</TabsTrigger>
        </TabsList>

        <TabsContent value='status'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-semibold text-xl'>
                {t('status_management')}
              </CardTitle>
              <Button onClick={() => setIsStatusDialogOpen(true)} size='sm'>
                <Plus className='mr-2 h-4 w-4' />
                {t('add_status')}
              </Button>
            </CardHeader>
            <CardContent>
              {renderValues(
                statusConfig?.value
                  ? JSON.parse(statusConfig.value)
                  : undefined,
                isStatusLoading,
                (value) => removeStatus.mutate({ value }),
                'status'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='priority'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-semibold text-xl'>
                {t('priority_management')}
              </CardTitle>
              <Button onClick={() => setIsPriorityDialogOpen(true)} size='sm'>
                <Plus className='mr-2 h-4 w-4' />
                {t('add_priority')}
              </Button>
            </CardHeader>
            <CardContent>
              {renderValues(
                priorityConfig?.value
                  ? JSON.parse(priorityConfig.value)
                  : undefined,
                isPriorityLoading,
                (value) => removePriority.mutate({ value }),
                'priority'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='source'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='font-semibold text-xl'>
                {t('source_management')}
              </CardTitle>
              <Button onClick={() => setIsSourceDialogOpen(true)} size='sm'>
                <Plus className='mr-2 h-4 w-4' />
                {t('add_source')}
              </Button>
            </CardHeader>
            <CardContent>
              {renderValues(
                sourceConfig?.value
                  ? JSON.parse(sourceConfig.value)
                  : undefined,
                isSourceLoading,
                (value) => removeSource.mutate({ value }),
                'source'
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isStatusDialogOpen}
        onOpenChange={(open) => {
          setIsStatusDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('edit_status') : t('add_status')}
            </DialogTitle>
          </DialogHeader>
          <Form {...statusForm}>
            <form
              onSubmit={statusForm.handleSubmit(onSubmitStatus)}
              className='space-y-4'
            >
              <FormField
                control={statusForm.control}
                name='value'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('status_value')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('enter_status_value')} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={statusForm.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('color')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='color' className='h-10 w-full' />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='submit'>
                  {editingItem ? t('update') : t('add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPriorityDialogOpen}
        onOpenChange={(open) => {
          setIsPriorityDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('edit_priority') : t('add_priority')}
            </DialogTitle>
          </DialogHeader>
          <Form {...priorityForm}>
            <form
              onSubmit={priorityForm.handleSubmit(onSubmitPriority)}
              className='space-y-4'
            >
              <FormField
                control={priorityForm.control}
                name='value'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('priority_value')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('enter_priority_value')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={priorityForm.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('color')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='color' className='h-10 w-full' />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='submit'>
                  {editingItem ? t('update') : t('add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSourceDialogOpen}
        onOpenChange={(open) => {
          setIsSourceDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('edit_source') : t('add_source')}
            </DialogTitle>
          </DialogHeader>
          <Form {...sourceForm}>
            <form
              onSubmit={sourceForm.handleSubmit(onSubmitSource)}
              className='space-y-4'
            >
              <FormField
                control={sourceForm.control}
                name='value'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('source_value')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('enter_source_value')} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={sourceForm.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('color')}</FormLabel>
                    <FormControl>
                      <Input {...field} type='color' className='h-10 w-full' />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type='submit'>
                  {editingItem ? t('update') : t('add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
