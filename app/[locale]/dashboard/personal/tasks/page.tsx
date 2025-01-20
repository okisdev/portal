'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
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

export default function TasksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: string; data: TaskFormValues } | null>(null);

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

  return (
    <div className='container mx-auto max-w-4xl space-y-8 p-6'>
      <PageHeader title='Personal Tasks' description='Manage your personal tasks and stay organized' />

      <div className='flex items-center justify-between gap-4'>
        <Button variant='outline' onClick={() => setIsCreateOpen(true)}>
          <PlusIcon className='mr-2 h-4 w-4' />
          Add Task
        </Button>
      </div>

      <div className='grid gap-4'>
        {tasks.map((task: any) => (
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
        {tasks.length === 0 && (
          <div className='flex h-32 items-center justify-center rounded-lg border bg-card'>
            <p className='text-muted-foreground'>No tasks yet. Add your first task above!</p>
          </div>
        )}
      </div>

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
