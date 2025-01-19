'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Complete project proposal',
      completed: false,
      priority: 'high',
      dueDate: '2024-03-25',
    },
    {
      id: 2,
      title: 'Review weekly reports',
      completed: true,
      priority: 'medium',
      dueDate: '2024-03-20',
    },
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (!newTask.trim()) {
      toast.error('Task cannot be empty');
      return;
    }

    const task: Task = {
      id: Date.now(),
      title: newTask,
      completed: false,
      priority: 'medium',
    };

    setTasks([...tasks, task]);
    setNewTask('');
  };

  const toggleComplete = (taskId: number) => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)));
  };

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className='container mx-auto max-w-4xl space-y-8 p-6'>
      <PageHeader title='Personal Tasks' description='Manage your personal tasks and stay organized' />

      <div className='flex items-center gap-4'>
        <input
          type='text'
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder='Add a new task...'
          className='h-8 flex-1 rounded-md border bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <Button variant='outline' className='h-8' onClick={addTask}>
          <PlusIcon className='mr-2 h-4 w-4' />
          Add Task
        </Button>
      </div>

      <div className='grid gap-4'>
        {tasks.map((task) => (
          <div key={task.id} className={`group rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md ${task.completed ? 'opacity-70' : ''}`}>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex flex-1 items-center gap-4'>
                <input
                  type='checkbox'
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id)}
                  className='h-5 w-5 rounded-sm border-primary text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                />
                <div className='flex flex-1 flex-col gap-1'>
                  <span className={`font-medium text-foreground ${task.completed ? 'line-through opacity-70' : ''}`}>{task.title}</span>
                  <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                    {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    <ColorBadge type='priority' value={task.priority} />
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                <Button variant='ghost' size='icon' onClick={() => {}} className='h-8 w-8'>
                  <PencilIcon className='h-4 w-4' />
                </Button>
                <Button variant='ghost' size='icon' onClick={() => deleteTask(task.id)} className='h-8 w-8 text-destructive hover:text-destructive/90'>
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
    </div>
  );
}
