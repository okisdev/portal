'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FilterIcon, LayoutGridIcon, ListIcon, PlusIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import KanbanBoard from '@/components/dashboard/workspace/tasks/kanban';
import TaskList from '@/components/dashboard/workspace/tasks/list';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z
    .enum(['backlog', 'todo', 'in_progress', 'in_review', 'done'])
    .default('todo'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  dueDate: z.date().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;
type ViewMode = 'list' | 'kanban';

const STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
] as const;

interface Task {
  id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: Date;
}

const transformTask = (task: any): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || undefined,
  content: task.content || undefined,
  status: task.status || 'todo',
  priority: task.priority || 'medium',
  dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
});

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const t = useTranslations();

  // Get view mode from URL or default to list
  const defaultViewMode = (searchParams.get('view') as ViewMode) || 'list';
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // Get visible statuses from URL or show all by default
  const defaultVisibleStatuses =
    searchParams.get('statuses')?.split(',') || STATUSES;
  const [visibleStatuses, setVisibleStatuses] = useState<
    (typeof STATUSES)[number][]
  >(defaultVisibleStatuses as (typeof STATUSES)[number][]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{
    id: string;
    data: TaskFormValues;
  } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingContent, setViewingContent] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);
  const [keepCreating, setKeepCreating] = useState(false);

  const utils = api.useUtils();
  const { data: apiTasks = [] } = api.task.getAll.useQuery();
  const tasks = apiTasks.map(transformTask);
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      utils.task.getAll.invalidate();
      if (!keepCreating) {
        setIsCreateOpen(false);
      }
      form.reset({
        title: '',
        description: '',
        content: '',
        status: 'todo',
        priority: 'medium',
        dueDate: undefined,
      });
      toast.success(t('task_created_successfully'));
    },
  });
  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      utils.task.getAll.invalidate();
      setEditingTask(null);
      toast.success(t('task_updated_successfully'));
    },
  });
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      utils.task.getAll.invalidate();
      toast.success(t('task_deleted_successfully'));
    },
  });

  const form = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      status: 'todo',
      priority: 'medium',
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    const formData = {
      ...data,
      description: data.description || undefined,
      content: data.content || undefined,
      dueDate: data.dueDate,
    };

    if (editingTask) {
      updateTask.mutate({
        id: editingTask.id,
        data: formData,
      });
    } else {
      createTask.mutate(formData);
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask({
      id: task.id,
      data: {
        title: task.title,
        description: task.description || '',
        content: task.content || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      },
    });
    form.reset({
      title: task.title,
      description: task.description || '',
      content: task.content || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    });
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate({ id });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTask.mutate({
      id,
      data: { status: status as any },
    });
  };

  const handleContentView = (task: any) => {
    setViewingContent({
      id: task.id,
      title: task.title,
      content: task.content || '',
    });
  };

  // Update URL when view mode changes
  const updateViewMode = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', mode);
    router.push(`${pathname}?${params.toString()}`);
    setViewMode(mode);
  };

  // Update URL when visible statuses change
  const updateVisibleStatuses = (statuses: (typeof STATUSES)[number][]) => {
    const params = new URLSearchParams(searchParams);
    params.set('statuses', statuses.join(','));
    router.push(`${pathname}?${params.toString()}`);
    setVisibleStatuses(statuses);
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='container mx-auto max-w-7xl space-y-8 px-6 py-6 pb-0 2xl:px-0'>
        <PageHeader
          description='Manage your personal tasks and stay organized'
          title='Personal Tasks'
        />

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              className='h-8'
              onClick={() => setIsCreateOpen(true)}
              variant='outline'
            >
              <PlusIcon className='mr-2 h-4 w-4' />
              Add Task
            </Button>

            <Popover onOpenChange={setIsFilterOpen} open={isFilterOpen}>
              <PopoverTrigger asChild>
                <Button className='h-8 gap-2' variant='outline'>
                  <FilterIcon className='h-4 w-4' />
                  Filter
                  {visibleStatuses.length !== STATUSES.length && (
                    <span className='rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs'>
                      {visibleStatuses.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-80'>
                <div className='space-y-4'>
                  <h4 className='font-medium'>Filter by Status</h4>
                  <div className='space-y-2'>
                    {STATUSES.map((status) => (
                      <div className='flex items-center space-x-2' key={status}>
                        <Checkbox
                          checked={visibleStatuses.includes(status)}
                          id={status}
                          onCheckedChange={(checked) => {
                            const newStatuses = checked
                              ? [...visibleStatuses, status]
                              : visibleStatuses.filter((s) => s !== status);
                            updateVisibleStatuses(newStatuses);
                          }}
                        />
                        <label
                          className='font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                          htmlFor={status}
                        >
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              className='h-8 w-8'
              onClick={() => updateViewMode('list')}
              size='icon'
              variant={viewMode === 'list' ? 'default' : 'outline'}
            >
              <ListIcon className='h-4 w-4' />
            </Button>
            <Button
              className='h-8 w-8'
              onClick={() => updateViewMode('kanban')}
              size='icon'
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
            >
              <LayoutGridIcon className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-hidden p-6 pt-8'>
        <div className='h-full overflow-auto'>
          {viewMode === 'list' ? (
            <TaskList
              onContentView={handleContentView}
              onDelete={handleDelete}
              onEdit={handleEdit}
              tasks={tasks}
              visibleStatuses={visibleStatuses}
            />
          ) : (
            <KanbanBoard
              onContentView={handleContentView}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              tasks={tasks}
              visibleStatuses={visibleStatuses}
            />
          )}
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (open) {
            if (!editingTask) {
              form.reset({
                title: '',
                description: '',
                content: '',
                status: 'todo',
                priority: 'medium',
                dueDate: undefined,
              });
            }
            setIsCreateOpen(true);
          } else {
            setIsCreateOpen(false);
            setEditingTask(null);
            setKeepCreating(false);
          }
        }}
        open={isCreateOpen || !!editingTask}
      >
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for your task.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Task title' {...field} />
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
                      <Textarea placeholder='Task description' {...field} />
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
                      <Textarea
                        className='min-h-[200px]'
                        placeholder='Add detailed content for your task...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select priority' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='urgent'>Urgent</SelectItem>
                          <SelectItem value='high'>High</SelectItem>
                          <SelectItem value='medium'>Medium</SelectItem>
                          <SelectItem value='low'>Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='backlog'>Backlog</SelectItem>
                          <SelectItem value='todo'>To Do</SelectItem>
                          <SelectItem value='in_progress'>
                            In Progress
                          </SelectItem>
                          <SelectItem value='in_review'>In Review</SelectItem>
                          <SelectItem value='done'>Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='dueDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        onChange={field.onChange}
                        showTimePicker={true}
                        value={field.value || new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className='flex items-center gap-4'>
                {!editingTask && (
                  <div className='flex flex-1 items-center gap-2'>
                    <Switch
                      checked={keepCreating}
                      id='keep-creating'
                      onCheckedChange={setKeepCreating}
                    />
                    <Label htmlFor='keep-creating'>Keep creating</Label>
                  </div>
                )}
                <Button
                  disabled={createTask.isPending || updateTask.isPending}
                  type='submit'
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => !open && setViewingContent(null)}
        open={!!viewingContent}
      >
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{viewingContent?.title}</DialogTitle>
          </DialogHeader>
          <div className='prose prose-sm dark:prose-invert max-w-none'>
            {viewingContent?.content.split('\n').map((line, i) => (
              <p key={`${viewingContent.id}-line-${i}`}>{line}</p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
