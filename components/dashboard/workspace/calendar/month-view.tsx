import { Button } from '@/components/ui/button';
import {} from '@/components/ui/popover';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WEEKDAYS } from './constants';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  events: CalendarEventWithParticipants[];
  folders: CalendarFolder[];
  hiddenCalendars: Set<string>;
  onEventEdit: (event: CalendarEventWithParticipants) => void;
  onEventDelete: (eventId: string) => void;
}

export function MonthView({ currentDate, selectedDate, setSelectedDate, events, folders, hiddenCalendars, onEventEdit, onEventDelete }: MonthViewProps) {
  const t = useTranslations();

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

  const getEventsForDate = (date: Date) => {
    return events?.filter((event) => event.startAt.getDate() === date.getDate() && event.startAt.getMonth() === date.getMonth() && event.startAt.getFullYear() === date.getFullYear()) ?? [];
  };

  return (
    <div className='grid flex-1 grid-cols-7'>
      {WEEKDAYS.map((day) => (
        <div key={day} className='border-r border-b p-2 text-muted-foreground text-sm'>
          <span className='hidden md:inline'>{t(day)}</span>
          <span className='md:hidden'>{t(day).charAt(0)}</span>
        </div>
      ))}
      {getDaysInMonth(currentDate).map((date) => {
        const events = getEventsForDate(date);

        return (
          <button
            key={date.toISOString()}
            type='button'
            className={cn(
              'relative min-h-[80px] border-r border-b p-1 text-left md:min-h-[120px] md:p-2',
              date.getMonth() !== currentDate.getMonth() && 'bg-muted/50',
              date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() && 'ring-2 ring-primary ring-inset'
            )}
            onClick={() => setSelectedDate(date)}
          >
            <span
              className={cn(
                'text-sm',
                date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear() &&
                  'inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
              )}
            >
              {date.getDate()}
            </span>
            <div className='mt-1 space-y-1 overflow-y-auto'>
              {events
                .filter((event) => !hiddenCalendars.has(event.folderId))
                .map((event) => {
                  const folder = folders.find((f) => f.id === event.folderId);
                  const bgColor = folder?.color ? `${folder.color}20` : undefined;
                  return (
                    <button
                      key={event.id}
                      type='button'
                      className='group relative flex w-full cursor-pointer items-center gap-1 rounded bg-primary/10 px-1 py-0.5 text-left text-xs'
                      style={{ backgroundColor: bgColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventEdit?.(event);
                      }}
                    >
                      <div className='h-1.5 w-1.5 flex-shrink-0 rounded-full' style={{ backgroundColor: folder?.color ?? undefined }} />
                      <span className='truncate'>{event.title}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='absolute right-0 top-1/2 hidden h-4 w-4 -translate-y-1/2 p-0 opacity-0 group-hover:opacity-100 md:inline-flex'
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventDelete?.(event.id);
                        }}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </button>
                  );
                })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
