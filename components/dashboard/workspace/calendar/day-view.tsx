import { useTranslations } from 'next-intl';
import type {
  CalendarEventWithParticipants,
  CalendarFolder,
} from '@/lib/schema';
import { DayHeader } from './day-header';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';

interface DayViewProps {
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

export function DayView({
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
}: DayViewProps) {
  const t = useTranslations();

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-[50px_1fr] divide-x border-b bg-background md:grid-cols-[100px_1fr]'>
        <div className='p-2 text-muted-foreground text-sm'>
          <span className='hidden md:inline'>{t('time')}</span>
          <span className='md:hidden'>{t('time').charAt(0)}</span>
        </div>
        <DayHeader
          date={currentDate}
          events={events}
          folders={folders}
          hiddenCalendars={hiddenCalendars}
          isCompact={true}
          onEventDelete={onEventDelete}
          onEventEdit={onEventEdit}
          selectedDate={selectedDate}
        />
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div
          className='-mr-[1px] grid grid-cols-[50px_1fr] divide-x md:grid-cols-[100px_1fr]'
          style={{ height: 'calc(60px * 24)' }}
        >
          <TimeColumn />
          <TimeGrid
            date={currentDate}
            events={events.filter((event) => !event.isAllDay)}
            folders={folders}
            hiddenCalendars={hiddenCalendars}
            isSelecting={isSelecting}
            isTimeSlotSelected={isTimeSlotSelected}
            onEventDelete={onEventDelete}
            onEventEdit={onEventEdit}
            onSelectionEnd={onSelectionEnd}
            onTimeSelect={onTimeSelect}
          />
        </div>
      </div>
    </div>
  );
}
