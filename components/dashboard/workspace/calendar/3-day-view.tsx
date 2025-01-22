import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { WEEKDAYS } from './constants';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';
import { useTranslations } from 'next-intl';

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
    const days = [];
    for (let i = 0; i < 3; i++) {
      const day = new Date(date);
      day.setDate(date.getDate() + i);
      days.push(day);
    }
    return days;
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-4 divide-x border-b bg-background'>
        <div className='p-2 text-muted-foreground text-sm'>Time</div>
        {get3Days(currentDate).map((date) => (
          <div
            key={date.toISOString()}
            className={cn(
              'p-2 text-sm',
              date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear() && 'bg-accent',
              date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() && 'bg-primary/10'
            )}
          >
            <div className='font-medium'>{t(WEEKDAYS[date.getDay()])}</div>
            <div className='text-muted-foreground'>{date.getDate()}</div>
          </div>
        ))}
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div className='grid grid-cols-4 divide-x' style={{ height: 'calc(60px * 24)' }}>
          <TimeColumn />
          {get3Days(currentDate).map((date) => (
            <TimeGrid
              key={date.toISOString()}
              date={date}
              events={events}
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
