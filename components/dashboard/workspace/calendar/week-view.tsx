import { EventPopover } from '@/components/shared/event-popover';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { eachDayOfInterval, endOfWeek, isSameDay, startOfWeek } from 'date-fns';
import { useTranslations } from 'next-intl';
import { WEEKDAYS } from './constants';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEventWithParticipants[];
  folders: CalendarFolder[];
  hiddenCalendars: Set<string>;
  onTimeSelect: (date: Date, hour: number, minute: number, isStart: boolean, e?: React.MouseEvent) => void;
  isSelecting: boolean;
  isTimeSlotSelected: (date: Date, hour: number, minute: number) => boolean;
  onSelectionEnd: () => void;
  onEventEdit?: (event: CalendarEventWithParticipants) => void;
  onEventDelete?: (eventId: string) => void;
}

export function WeekView({ currentDate, selectedDate, events, folders, hiddenCalendars, onTimeSelect, isSelecting, isTimeSlotSelected, onSelectionEnd, onEventEdit, onEventDelete }: WeekViewProps) {
  const t = useTranslations();

  const getWeekDays = (date: Date) => {
    return eachDayOfInterval({
      start: startOfWeek(date),
      end: endOfWeek(date),
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startAt);
      return isSameDay(eventDate, date) && event.isAllDay;
    });
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-8 divide-x border-b bg-background'>
        <div className='p-2 text-muted-foreground text-sm'>{t('time')}</div>
        {getWeekDays(currentDate).map((date) => (
          <div key={date.toISOString()} className={cn('flex flex-col p-1 text-sm md:p-2', isSameDay(date, new Date()) && 'bg-accent', isSameDay(date, selectedDate) && 'bg-primary/10')}>
            <div className='font-medium'>{t(WEEKDAYS[date.getDay()])}</div>
            <div className='text-muted-foreground'>{date.getDate()}</div>
            <div className='mt-1 flex flex-col gap-1'>
              {getEventsForDate(date)
                .filter((event) => !hiddenCalendars.has(event.folderId))
                .map((event) => {
                  const folder = folders?.find((f) => f.id === event.folderId);
                  return <EventPopover key={event.id} event={event} folder={folder} onEventEdit={onEventEdit} onEventDelete={onEventDelete} />;
                })}
            </div>
          </div>
        ))}
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div className='grid grid-cols-8 divide-x' style={{ height: 'calc(60px * 24)' }}>
          <TimeColumn />
          {getWeekDays(currentDate).map((date) => (
            <TimeGrid
              key={date.toISOString()}
              date={date}
              events={events.filter((event) => !event.isAllDay)}
              folders={folders}
              hiddenCalendars={hiddenCalendars}
              onTimeSelect={onTimeSelect}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={onSelectionEnd}
              onEventEdit={onEventEdit}
              onEventDelete={onEventDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
