import { EventPopover } from '@/components/shared/event-popover';
import type {
  CalendarEventWithParticipants,
  CalendarFolder,
} from '@/lib/schema';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { useTranslations } from 'next-intl';
import { WEEKDAYS } from './constants';

interface DayHeaderProps {
  date: Date;
  selectedDate: Date;
  events: CalendarEventWithParticipants[];
  folders: CalendarFolder[];
  hiddenCalendars: Set<string>;
  onEventEdit?: (event: CalendarEventWithParticipants) => void;
  onEventDelete?: (eventId: string) => void;
  isCompact?: boolean;
}

export function DayHeader({
  date,
  selectedDate,
  events,
  folders,
  hiddenCalendars,
  onEventEdit,
  onEventDelete,
  isCompact = false,
}: DayHeaderProps) {
  const t = useTranslations();

  const allDayEvents = events.filter((event) => {
    const eventDate = new Date(event.startAt);
    return isSameDay(eventDate, date) && event.isAllDay;
  });

  return (
    <div
      className={cn(
        'flex flex-col p-1 text-sm md:p-2',
        isSameDay(date, selectedDate) && 'ring-2 ring-primary ring-inset'
      )}
    >
      <div className='font-medium'>
        {isCompact ? (
          <>
            <span className='hidden md:inline'>
              {t(WEEKDAYS[date.getDay()])}
            </span>
            <span className='md:hidden'>
              {t(WEEKDAYS[date.getDay()]).charAt(0)}
            </span>
          </>
        ) : (
          t(WEEKDAYS[date.getDay()])
        )}
      </div>
      <div
        className={cn(
          'text-muted-foreground',
          isSameDay(date, new Date()) &&
            'inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
        )}
      >
        {date.getDate()}
      </div>
      <div className='mt-1 flex flex-col gap-1'>
        {allDayEvents
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
    </div>
  );
}
