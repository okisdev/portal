'use client';

import { ColorBadge } from '@/components/shared/color-badge';
import { PageHeader } from '@/components/shared/page-header';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';

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
    if (!newTask.trim()) return;

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
    <div className='space-y-4 p-4'>
      <PageHeader title='Personal Tasks' description='Manage your personal tasks' />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <input
            type='text'
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder='Add a new task...'
            className='flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button type='button' onClick={addTask} className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'>
            <PlusIcon className='h-5 w-5' />
            Add Task
          </button>
        </div>
      </div>

      <div className='space-y-4'>
        {tasks.map((task) => (
          <div key={task.id} className={`flex items-center justify-between rounded-lg border bg-card p-4 ${task.completed ? 'opacity-70' : ''}`}>
            <div className='flex items-center gap-4'>
              <input type='checkbox' checked={task.completed} onChange={() => toggleComplete(task.id)} className='h-5 w-5 rounded border-muted focus:ring-2 focus:ring-primary' />
              <span className={`text-foreground ${task.completed ? 'line-through opacity-70' : ''}`}>{task.title}</span>
              {task.dueDate && <span className='text-muted-foreground text-sm'>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
              <ColorBadge type='priority' value={task.priority} />
            </div>

            <div className='flex gap-2'>
              <button type='button' onClick={() => {}} className='p-2 text-muted-foreground hover:text-foreground'>
                <PencilIcon className='h-5 w-5' />
              </button>
              <button type='button' onClick={() => deleteTask(task.id)} className='p-2 text-destructive hover:text-destructive/90'>
                <TrashIcon className='h-5 w-5' />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
