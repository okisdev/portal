import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { addDays, eachDayOfInterval } from 'date-fns';
import { useTranslations } from 'next-intl';
import { DayHeader } from './day-header';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';

interface ThreeDayViewProps {
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

export function ThreeDayView({
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
}: ThreeDayViewProps) {
  const t = useTranslations();

  const get3Days = (date: Date) => {
    return eachDayOfInterval({
      start: date,
      end: addDays(date, 2),
    });
  };

  const threeDays = get3Days(currentDate);

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-[50px_repeat(3,1fr)] divide-x border-b bg-background md:grid-cols-[100px_repeat(3,1fr)]'>
        <div className='p-2 text-muted-foreground text-sm'>
          <span className='hidden md:inline'>{t('time')}</span>
          <span className='md:hidden'>{t('time').charAt(0)}</span>
        </div>
        {threeDays.map((date) => (
          <DayHeader
            key={date.toISOString()}
            date={date}
            selectedDate={selectedDate}
            events={events}
            folders={folders}
            hiddenCalendars={hiddenCalendars}
            onEventEdit={onEventEdit}
            onEventDelete={onEventDelete}
            isCompact={true}
          />
        ))}
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div className='grid grid-cols-[50px_repeat(3,1fr)] divide-x md:grid-cols-[100px_repeat(3,1fr)]' style={{ height: 'calc(60px * 24)' }}>
          <TimeColumn />
          {threeDays.map((date) => (
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
