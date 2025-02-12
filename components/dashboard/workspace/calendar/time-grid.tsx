import { EventPopover } from '@/components/shared/event-popover';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { cn } from '@/lib/utils';

interface TimeGridProps {
  date: Date;
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

export function TimeGrid({ date, events, folders, hiddenCalendars, onTimeSelect, isSelecting, isTimeSlotSelected, onSelectionEnd, onEventEdit, onEventDelete }: TimeGridProps) {
  const getHoursOfDay = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const getMinuteIntervalsForHour = () => {
    return [0, 15, 30, 45];
  };

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    return (
      events?.filter((event) => {
        const eventDate = new Date(event.startAt);
        return eventDate.getDate() === date.getDate() && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear() && eventDate.getHours() === hour;
      }) ?? []
    );
  };

  return (
    <div className='relative divide-y'>
      {getHoursOfDay().map((hour) => {
        const hourEvents = getEventsForDateAndHour(date, hour).filter((event) => !hiddenCalendars.has(event.folderId));
        return (
          <div key={hour} className='relative h-[60px] w-full cursor-pointer'>
            <div className='pointer-events-none absolute inset-0 w-full'>
              {getMinuteIntervalsForHour().map((minute) => (
                <div key={`${hour}-${minute}`} className={cn('h-[15px] w-full', isTimeSlotSelected(date, hour, minute) && 'bg-primary/20', minute < 45 && 'border-border/30 border-b')} />
              ))}
            </div>
            <div className='relative z-10 p-1'>
              {hourEvents.map((event) => {
                const folder = folders?.find((f) => f.id === event.folderId);
                return <EventPopover key={event.id} event={event} folder={folder} onEventEdit={onEventEdit} onEventDelete={onEventDelete} onEventClick={(e) => e.stopPropagation()} />;
              })}
            </div>
            <div
              className='absolute inset-0'
              onMouseDown={(e) => onTimeSelect(date, hour, 0, true, e)}
              onMouseMove={(e) => {
                if (isSelecting) {
                  onTimeSelect(date, hour, 0, false, e);
                }
              }}
              onMouseUp={onSelectionEnd}
            />
          </div>
        );
      })}
    </div>
  );
}
