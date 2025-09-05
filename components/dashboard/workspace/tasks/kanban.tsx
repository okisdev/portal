import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { format } from 'date-fns';
import {
  AlignLeftIcon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { ColorBadge } from '@/components/shared/color-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { STATUS_LABELS } from './list';

interface Task {
  id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: Date;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onContentClick: (task: Task) => void;
}

function TaskCard({ task, onEdit, onDelete, onContentClick }: TaskCardProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'group z-50 cursor-grab rounded-lg border bg-card p-4 shadow-xs transition-all hover:shadow-md active:cursor-grabbing',
        isDragging ? 'scale-105 shadow-lg ring-2 ring-primary' : ''
      )}
      data-task-id={task.id}
    >
      <div className='flex items-center justify-between'>
        <div className='flex flex-1 flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-foreground text-sm'>
                {task.title}
              </span>
              {task.content && (
                <Button
                  className='h-6 w-6'
                  onClick={() => onContentClick(task)}
                  size='icon'
                  variant='ghost'
                >
                  <AlignLeftIcon className='h-4 w-4' />
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className='h-8 w-8 opacity-0 group-hover:opacity-100'
                  size='icon'
                  variant='ghost'
                >
                  <MoreVerticalIcon className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <PencilIcon className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  <TrashIcon className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.description && (
            <p className='text-muted-foreground text-xs'>{task.description}</p>
          )}
          <div className='flex items-center gap-3 text-muted-foreground text-xs'>
            {task.dueDate && (
              <span>
                Due: {format(new Date(task.dueDate), 'MM/dd/yyyy HH:mm')}
              </span>
            )}
            {task.priority && (
              <ColorBadge type='priority' value={task.priority} />
            )}
          </div>
        </div>
      </div>

      <ActionAlertDialog
        description='Are you sure you want to delete this task? This action cannot be undone.'
        onConfirm={() => {
          onDelete(task.id);
          setIsDeleteAlertOpen(false);
        }}
        onOpenChange={setIsDeleteAlertOpen}
        open={isDeleteAlertOpen}
        title='Delete Task'
      />
    </div>
  );
}

interface DroppableColumnProps {
  status: string;
  children: [React.ReactNode, React.ReactNode];
}

function DroppableColumn({ status, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
  });

  const [header, content] = children;

  return (
    <div className='flex h-full flex-col' data-status={status} ref={setNodeRef}>
      <div className='flex items-center justify-between pb-4'>{header}</div>
      <div
        className={cn(
          'flex-1 overflow-hidden rounded-lg border transition-colors duration-200',
          isOver ? 'border-primary/50 bg-primary/10' : 'bg-muted/50'
        )}
        id={`droppable-${status}`}
      >
        <div className='h-full overflow-y-auto p-4'>{content}</div>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  visibleStatuses: string[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onContentView: (task: Task) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function KanbanBoard({
  tasks,
  visibleStatuses,
  onEdit,
  onDelete,
  onContentView,
  onStatusChange,
}: KanbanBoardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const taskId = active.id as string;
    const newStatus = (over.id as string).replace('droppable-', '');

    onStatusChange(taskId, newStatus);
  };

  const tasksByStatus = visibleStatuses.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  return (
    <div className={cn('h-full', isDragging ? 'cursor-grabbing' : '')}>
      <DndContext
        onDragCancel={() => {
          setIsDragging(false);
        }}
        onDragEnd={(event) => {
          setIsDragging(false);
          handleDragEnd(event);
        }}
        onDragStart={() => {
          setIsDragging(true);
        }}
        sensors={sensors}
      >
        <div className='container mx-auto max-w-7xl'>
          <div className='grid h-full grid-cols-1 gap-6 md:grid-cols-5'>
            {visibleStatuses.map((status) => (
              <DroppableColumn key={status} status={status}>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold'>{STATUS_LABELS[status]}</h3>
                  <span className='rounded-full bg-muted px-2 py-1 text-xs'>
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <div className='flex flex-col gap-3'>
                  {tasksByStatus[status].map((task) => (
                    <div key={task.id}>
                      <TaskCard
                        onContentClick={onContentView}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        task={task}
                      />
                    </div>
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className='flex h-24 items-center justify-center rounded-lg border border-dashed'>
                      <p className='text-muted-foreground text-sm'>No tasks</p>
                    </div>
                  )}
                </div>
              </DroppableColumn>
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
