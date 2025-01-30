import { EventPopover } from '@/components/shared/event-popover';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { useTranslations } from 'next-intl';
import { WEEKDAYS } from './constants';
import { TimeColumn } from './time-column';
import { TimeGrid } from './time-grid';

interface DayViewProps {
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

export function DayView({ currentDate, selectedDate, events, folders, hiddenCalendars, onTimeSelect, isSelecting, isTimeSlotSelected, onSelectionEnd, onEventEdit, onEventDelete }: DayViewProps) {
  const t = useTranslations();

  const getAllDayEvents = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.startAt);
      return isSameDay(eventDate, currentDate) && event.isAllDay;
    });
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='grid grid-cols-[50px_1fr] divide-x border-b bg-background md:grid-cols-[100px_1fr]'>
        <div className='p-2 text-muted-foreground text-sm'>
          <span className='hidden md:inline'>{t('time')}</span>
          <span className='md:hidden'>{t('time').charAt(0)}</span>
        </div>
        <div className={cn('flex flex-col p-1 text-sm md:p-2', isSameDay(currentDate, new Date()) && 'bg-accent', isSameDay(currentDate, selectedDate) && 'bg-primary/10')}>
          <div className='font-medium'>
            <span className='hidden md:inline'>{t(WEEKDAYS[currentDate.getDay()])}</span>
            <span className='md:hidden'>{t(WEEKDAYS[currentDate.getDay()]).charAt(0)}</span>
          </div>
          <div className='text-muted-foreground'>{currentDate.getDate()}</div>
          <div className='mt-1 flex flex-col gap-1'>
            {getAllDayEvents()
              .filter((event) => !hiddenCalendars.has(event.folderId))
              .map((event) => {
                const folder = folders?.find((f) => f.id === event.folderId);
                return <EventPopover key={event.id} event={event} folder={folder} onEventEdit={onEventEdit} onEventDelete={onEventDelete} />;
              })}
          </div>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div className='-mr-[1px] grid grid-cols-[50px_1fr] divide-x md:grid-cols-[100px_1fr]' style={{ height: 'calc(60px * 24)' }}>
          <TimeColumn />
          <TimeGrid
            date={currentDate}
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
        </div>
      </div>
    </div>
  );
}
