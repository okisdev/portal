import { format } from 'date-fns';
import { AlignLeftIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { ColorBadge } from '@/components/shared/color-badge';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: Date;
}

interface TaskListProps {
  tasks: Task[];
  visibleStatuses: string[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onContentView: (task: Task) => void;
}

export const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export default function TaskList({
  tasks,
  visibleStatuses,
  onEdit,
  onDelete,
  onContentView,
}: TaskListProps) {
  const filteredTasks = tasks.filter(
    (task) => task.status && visibleStatuses.includes(task.status)
  );

  if (filteredTasks.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center rounded-lg border bg-card'>
        <p className='text-muted-foreground'>
          {tasks.length === 0
            ? 'No tasks yet. Add your first task above!'
            : 'No tasks match your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-7xl space-y-8'>
      {Object.entries(STATUS_LABELS)
        .filter(([status]) => visibleStatuses.includes(status))
        .map(([status, label]) => {
          const tasksInStatus = filteredTasks.filter(
            (task) => task.status === status
          );
          if (tasksInStatus.length === 0) {
            return null;
          }

          return (
            <div className='space-y-4' key={status}>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-lg'>{label}</h3>
                <span className='rounded-full bg-muted px-2 py-1 text-xs'>
                  {tasksInStatus.length}
                </span>
              </div>
              <div className='grid gap-4'>
                {tasksInStatus.map((task) => (
                  <div
                    className='group rounded-lg border bg-card p-4 shadow-xs transition-all hover:shadow-md'
                    key={task.id}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex flex-1 flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-foreground'>
                            {task.title}
                          </span>
                          {task.content && (
                            <Button
                              className='h-6 w-6'
                              onClick={() => onContentView(task)}
                              size='icon'
                              variant='ghost'
                            >
                              <AlignLeftIcon className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                        {task.description && (
                          <p className='text-muted-foreground text-sm'>
                            {task.description}
                          </p>
                        )}
                        <div className='flex items-center gap-3 text-muted-foreground text-sm'>
                          {task.dueDate && (
                            <span>
                              Due:{' '}
                              {format(
                                new Date(task.dueDate),
                                'MM/dd/yyyy HH:mm'
                              )}
                            </span>
                          )}
                          {task.priority && (
                            <ColorBadge type='priority' value={task.priority} />
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                        <Button
                          className='h-8 w-8'
                          onClick={() => onEdit(task)}
                          size='icon'
                          variant='ghost'
                        >
                          <PencilIcon className='h-4 w-4' />
                        </Button>
                        <Button
                          className='h-8 w-8 text-destructive hover:text-destructive/90'
                          onClick={() => onDelete(task.id)}
                          size='icon'
                          variant='ghost'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
