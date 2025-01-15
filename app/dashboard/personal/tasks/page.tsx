'use client';

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
    <div className='space-y-6 p-6'>
      <PageHeader title='Personal Tasks' description='Manage your personal tasks' />

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <input
            type='text'
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder='Add a new task...'
            className='flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button type='button' onClick={addTask} className='flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'>
            <PlusIcon className='h-5 w-5' />
            Add Task
          </button>
        </div>
      </div>

      <div className='space-y-4'>
        {tasks.map((task) => (
          <div key={task.id} className={`flex items-center justify-between rounded-lg border p-4 ${task.completed ? 'bg-gray-50' : 'bg-white'}`}>
            <div className='flex items-center gap-4'>
              <input type='checkbox' checked={task.completed} onChange={() => toggleComplete(task.id)} className='h-5 w-5 rounded border-gray-300 focus:ring-blue-500' />
              <span className={task.completed ? 'text-gray-500 line-through' : ''}>{task.title}</span>
              {task.dueDate && <span className='text-gray-500 text-sm'>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {task.priority}
              </span>
            </div>

            <div className='flex gap-2'>
              <button type='button' onClick={() => {}} className='p-2 text-gray-500 hover:text-gray-700'>
                <PencilIcon className='h-5 w-5' />
              </button>
              <button type='button' onClick={() => deleteTask(task.id)} className='p-2 text-red-500 hover:text-red-700'>
                <TrashIcon className='h-5 w-5' />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
