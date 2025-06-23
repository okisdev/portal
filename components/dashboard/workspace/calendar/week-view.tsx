import type {
  CalendarEventWithParticipants,
  CalendarFolder,
} from '@/lib/schema';
import { eachDayOfInterval, endOfWeek, startOfWeek } from 'date-fns';
import { useTranslations } from 'next-intl';
import { DayHeader } from './day-header';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEventWithParticipants[];
  folders: CalendarFolder[];
  hiddenCalendars: Set<string>;
  onTimeSelect: (
    date: Date,
    hour: number,
    minute: number,
    isStart: boolean,
    e?: React.MouseEvent
  ) => void;
  isSelecting: boolean;
  isTimeSlotSelected: (date: Date, hour: number, minute: number) => boolean;
  onSelectionEnd: () => void;
  onEventEdit?: (event: CalendarEventWithParticipants) => void;
  onEventDelete?: (eventId: string) => void;
}

export function WeekView({
  currentDate,
  selectedDate,
  events,
  folders,
  hiddenCalendars,
  onTimeSelect,
  isSelecting,
  isTimeSlotSelected,
  onSelectionEnd,
  onEventEdit,
  onEventDelete,
}: WeekViewProps) {
  const t = useTranslations();

  const getWeekDays = (date: Date) => {
    return eachDayOfInterval({
      start: startOfWeek(date),
      end: endOfWeek(date),
    });
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-8 divide-x border-b bg-background'>
        <div className='p-2 text-muted-foreground text-sm'>{t('time')}</div>
        {getWeekDays(currentDate).map((date) => (
          <DayHeader
            key={date.toISOString()}
            date={date}
            selectedDate={selectedDate}
            events={events}
            folders={folders}
            hiddenCalendars={hiddenCalendars}
            onEventEdit={onEventEdit}
            onEventDelete={onEventDelete}
          />
        ))}
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div
          className='grid grid-cols-8 divide-x'
          style={{ height: 'calc(60px * 24)' }}
        >
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
