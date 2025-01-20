'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { FilterIcon, LayoutGridIcon, ListIcon, PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done']).default('todo'),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  dueDate: z.date().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;
type ViewMode = 'list' | 'kanban';

const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

function TaskCard({ task, onEdit, onDelete, onStatusChange }: any) {
  return (
    <div className='group rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-1 flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <span className='font-medium text-foreground'>{task.title}</span>
            <div className='flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
              <Button variant='ghost' size='icon' onClick={() => onEdit(task)} className='h-8 w-8'>
                <PencilIcon className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' onClick={() => onDelete(task.id)} className='h-8 w-8 text-destructive hover:text-destructive/90'>
                <TrashIcon className='h-4 w-4' />
              </Button>
            </div>
          </div>
          {task.description && <p className='text-sm text-muted-foreground'>{task.description}</p>}
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            {task.dueDate && <span>Due: {format(new Date(task.dueDate), 'MM/dd/yyyy HH:mm')}</span>}
            <ColorBadge type='priority' value={task.priority} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get view mode from URL or default to list
  const defaultViewMode = (searchParams.get('view') as ViewMode) || 'list';
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // Get visible statuses from URL or show all by default
  const defaultVisibleStatuses = searchParams.get('statuses')?.split(',') || STATUSES;
  const [visibleStatuses, setVisibleStatuses] = useState<(typeof STATUSES)[number][]>(defaultVisibleStatuses as (typeof STATUSES)[number][]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: string; data: TaskFormValues } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const utils = api.useUtils();
  const { data: tasks = [] } = api.task.getAll.useQuery();
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      utils.task.getAll.invalidate();
      setIsCreateOpen(false);
      form.reset();
      toast.success('Task created successfully');
    },
  });
  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      utils.task.getAll.invalidate();
      setEditingTask(null);
      toast.success('Task updated successfully');
    },
  });
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      utils.task.getAll.invalidate();
      toast.success('Task deleted successfully');
    },
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    if (editingTask) {
      updateTask.mutate({
        id: editingTask.id,
        data: {
          ...data,
          dueDate: data.dueDate,
        },
      });
    } else {
      createTask.mutate({
        ...data,
        dueDate: data.dueDate,
      });
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask({
      id: task.id,
      data: {
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      },
    });
    form.reset({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate({ id });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTask.mutate({
      id,
      data: { status: status as any },
    });
  };

  // Update URL when view mode changes
  const updateViewMode = useCallback(
    (mode: ViewMode) => {
      const params = new URLSearchParams(searchParams);
      params.set('view', mode);
      router.push(`${pathname}?${params.toString()}`);
      setViewMode(mode);
    },
    [pathname, router, searchParams]
  );

  // Update URL when visible statuses change
  const updateVisibleStatuses = useCallback(
    (statuses: (typeof STATUSES)[number][]) => {
      const params = new URLSearchParams(searchParams);
      params.set('statuses', statuses.join(','));
      router.push(`${pathname}?${params.toString()}`);
      setVisibleStatuses(statuses);
    },
    [pathname, router, searchParams]
  );

  // Filter tasks based on visible statuses
  const filteredTasks = tasks.filter((task: any) => visibleStatuses.includes(task.status));
  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredTasks.filter((task: any) => task.status === status);
    return acc;
  }, {} as Record<(typeof STATUSES)[number], typeof tasks>);

  return (
    <div className='container mx-auto max-w-7xl space-y-8 p-6'>
      <PageHeader title='Personal Tasks' description='Manage your personal tasks and stay organized' />

      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Button variant='outline' className='h-8' onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className='mr-2 h-4 w-4' />
            Add Task
          </Button>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant='outline' className='h-8 gap-2'>
                <FilterIcon className='h-4 w-4' />
                Filter
                {visibleStatuses.length !== STATUSES.length && <span className='rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs'>{visibleStatuses.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80' align='start'>
              <div className='space-y-4'>
                <h4 className='font-medium'>Filter by Status</h4>
                <div className='space-y-2'>
                  {STATUSES.map((status) => (
                    <div key={status} className='flex items-center space-x-2'>
                      <Checkbox
                        id={status}
                        checked={visibleStatuses.includes(status)}
                        onCheckedChange={(checked) => {
                          const newStatuses = checked ? [...visibleStatuses, status] : visibleStatuses.filter((s) => s !== status);
                          updateVisibleStatuses(newStatuses);
                        }}
                      />
                      <label htmlFor={status} className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {STATUS_LABELS[status]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size='icon' onClick={() => updateViewMode('list')} className='h-8 w-8'>
            <ListIcon className='h-4 w-4' />
          </Button>
          <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size='icon' onClick={() => updateViewMode('kanban')} className='h-8 w-8'>
            <LayoutGridIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className='grid gap-4'>
          {filteredTasks.map((task: any) => (
            <div key={task.id} className='group rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex flex-1 items-center gap-4'>
                  <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='backlog'>Backlog</SelectItem>
                      <SelectItem value='todo'>To Do</SelectItem>
                      <SelectItem value='in_progress'>In Progress</SelectItem>
                      <SelectItem value='in_review'>In Review</SelectItem>
                      <SelectItem value='done'>Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className='flex flex-1 flex-col gap-1'>
                    <span className='font-medium text-foreground'>{task.title}</span>
                    {task.description && <p className='text-sm text-muted-foreground'>{task.description}</p>}
                    <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                      {task.dueDate && <span>Due: {format(new Date(task.dueDate), 'MM/dd/yyyy HH:mm')}</span>}
                      <ColorBadge type='priority' value={task.priority} />
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                  <Button variant='ghost' size='icon' onClick={() => handleEdit(task)} className='h-8 w-8'>
                    <PencilIcon className='h-4 w-4' />
                  </Button>
                  <Button variant='ghost' size='icon' onClick={() => handleDelete(task.id)} className='h-8 w-8 text-destructive hover:text-destructive/90'>
                    <TrashIcon className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <div className='flex h-32 items-center justify-center rounded-lg border bg-card'>
              <p className='text-muted-foreground'>{tasks.length === 0 ? 'No tasks yet. Add your first task above!' : 'No tasks match your filters.'}</p>
            </div>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-5'>
          {STATUSES.filter((status) => visibleStatuses.includes(status)).map((status) => (
            <div key={status} className='flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold'>{STATUS_LABELS[status]}</h3>
                <span className='rounded-full bg-muted px-2 py-1 text-xs'>{tasksByStatus[status].length}</span>
              </div>
              <div className='flex flex-col gap-3'>
                {tasksByStatus[status].map((task: any) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className='flex h-24 items-center justify-center rounded-lg border border-dashed'>
                    <p className='text-sm text-muted-foreground'>No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isCreateOpen || !!editingTask}
        onOpenChange={(open) => {
          if (open) {
            setIsCreateOpen(true);
          } else {
            setIsCreateOpen(false);
            setEditingTask(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>Fill in the details for your task.</DialogDescription>
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

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select status' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='backlog'>Backlog</SelectItem>
                          <SelectItem value='todo'>To Do</SelectItem>
                          <SelectItem value='in_progress'>In Progress</SelectItem>
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
                      <DateTimePicker value={field.value || new Date()} onChange={field.onChange} showTimePicker={true} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type='submit' disabled={createTask.isPending || updateTask.isPending}>
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
