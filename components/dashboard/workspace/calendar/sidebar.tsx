import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MONTHS, WEEKDAYS } from './constants';
import { YearMonthPicker } from './year-month-picker';

interface CalendarSidebarProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  folders: CalendarFolder[];
  hiddenCalendars: Set<string>;
  onToggleCalendar: (folderId: string) => void;
  onAddCalendar: () => void;
  onEditCalendar: (folder: CalendarFolder) => void;
  onDeleteCalendar: (folderId: string) => void;
}

export function CalendarSidebar({ currentDate, selectedDate, onDateSelect, folders, hiddenCalendars, onToggleCalendar, onAddCalendar, onEditCalendar, onDeleteCalendar }: CalendarSidebarProps) {
  const t = useTranslations();

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  return (
    <div className='flex w-64 flex-col gap-4 border-r p-4'>
      <div className='flex items-center justify-between'>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' className='w-full justify-between'>
              <span>
                {currentDate.getFullYear()} {MONTHS[currentDate.getMonth()]}
              </span>
              <ChevronsUpDown className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[--radix-popper-anchor-width] p-0' align='start'>
            <YearMonthPicker
              value={currentDate}
              onChange={(date) => {
                // Update both selected date and current date
                onDateSelect(date);
                // Create a new date to avoid reference issues
                const newDate = new Date(date);
                // Set the date to the first of the month for consistent month view
                newDate.setDate(1);
                onDateSelect(newDate);
              }}
              onClose={() => {}}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className='grid grid-cols-7 gap-1 text-sm'>
        {WEEKDAYS.map((day) => (
          <div key={day} className='text-center text-muted-foreground'>
            {day.slice(0, 1)}
          </div>
        ))}
        {getDaysInMonth(currentDate)
          .slice(0, 35)
          .map((date) => (
            <Button
              key={date.toISOString()}
              variant='ghost'
              className={cn(
                'h-6 w-6 p-0',
                date.getMonth() !== currentDate.getMonth() && 'text-muted-foreground',
                date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() && 'bg-primary text-primary-foreground'
              )}
              onClick={() => onDateSelect(date)}
            >
              {date.getDate()}
            </Button>
          ))}
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex cursor-pointer items-center gap-2'>
          <div className='flex-1 text-sm'>Calendars</div>
          <Button variant='ghost' size='icon' className='h-6 w-6' onClick={onAddCalendar}>
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        <div className='flex w-full flex-col gap-2'>
          <div className='flex flex-col space-y-1'>
            {folders?.length === 0 && <div className='text-muted-foreground text-sm'>No calendars found</div>}
            {folders?.map((folder) => (
              <div key={folder.id} className='flex items-center gap-2'>
                <Checkbox checked={!hiddenCalendars.has(folder.id)} onCheckedChange={(checked) => onToggleCalendar(folder.id)} />
                <Button variant='ghost' className='h-8 min-w-0 flex-1 justify-start px-2' onClick={() => onToggleCalendar(folder.id)}>
                  <div className='flex min-w-0 flex-1 items-center'>
                    <div className='mr-1 h-4 w-4 flex-shrink-0 rounded-full' style={{ backgroundColor: folder.color ?? 'transparent' }} />
                    <span className='truncate'>{folder.name}</span>
                  </div>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0' onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className='h-4 w-4' />
                      <span className='sr-only'>Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='cursor-pointer' onClick={() => onEditCalendar(folder)}>
                      <Pencil className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className='cursor-pointer text-destructive' onClick={() => setFolderToDelete(folder.id)}>
                      <Trash className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ActionAlertDialog
        open={!!folderToDelete}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
        onConfirm={() => {
          if (folderToDelete) {
            onDeleteCalendar(folderToDelete);
            setFolderToDelete(null);
          }
        }}
        title='Delete Calendar'
        description='This action cannot be undone. This will permanently delete the calendar and all associated events.'
        confirmText='Delete'
        cancelText='Cancel'
      />
    </div>
  );
}
