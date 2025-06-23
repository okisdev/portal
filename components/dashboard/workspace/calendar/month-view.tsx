import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  getDate,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subDays,
} from 'date-fns';
import { useTranslations } from 'next-intl';
import { EventPopover } from '@/components/shared/event-popover';
import type {
  CalendarEventWithParticipants,
  CalendarFolder,
} from '@/lib/schema';
import { cn } from '@/lib/utils';
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

export function MonthView({
  currentDate,
  selectedDate,
  setSelectedDate,
  events,
  folders,
  hiddenCalendars,
  onEventEdit,
  onEventDelete,
}: MonthViewProps) {
  const t = useTranslations();

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    // Get the days before the start of month to fill the calendar
    const daysBeforeMonth = [];
    const firstDayOfWeek = start.getDay();
    if (firstDayOfWeek > 0) {
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        daysBeforeMonth.push(subDays(start, i + 1));
      }
    }

    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start, end });

    // Get the days after the month to complete the calendar grid
    const daysAfterMonth = [];
    const remainingDays = 42 - (daysBeforeMonth.length + daysInMonth.length);
    for (let i = 1; i <= remainingDays; i++) {
      daysAfterMonth.push(addDays(end, i));
    }

    return [...daysBeforeMonth, ...daysInMonth, ...daysAfterMonth];
  };

  const getEventsForDate = (date: Date) => {
    return events?.filter((event) => isSameDay(event.startAt, date)) ?? [];
  };

  return (
    <div className='grid flex-1 grid-cols-7'>
      {WEEKDAYS.map((day) => (
        <div
          key={day}
          className='border-r border-b p-2 text-muted-foreground text-sm'
        >
          {t(day)}
        </div>
      ))}
      {getDaysInMonth(currentDate).map((date) => {
        const events = getEventsForDate(date);

        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            key={date.toISOString()}
            className={cn(
              'relative min-h-[120px] border-r border-b p-2',
              !isSameMonth(date, currentDate) && 'bg-muted/50',
              isSameDay(date, selectedDate) && 'ring-2 ring-primary ring-inset'
            )}
            onClick={() => setSelectedDate(date)}
          >
            <span
              className={cn(
                'text-sm',
                isSameDay(date, new Date()) &&
                  'inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
              )}
            >
              {getDate(date)}
            </span>
            {events
              .filter((event) => !hiddenCalendars.has(event.folderId))
              .map((event) => {
                const folder = folders?.find((f) => f.id === event.folderId);

                return (
                  <EventPopover
                    key={event.id}
                    event={event}
                    folder={folder}
                    onEventEdit={onEventEdit}
                    onEventDelete={onEventDelete}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
