import { Button } from '@/components/ui/button';
import type { CalendarEventWithParticipants } from '@/lib/schema';
import { cn } from '@/lib/utils';

interface TimeGridProps {
  date: Date;
  events: CalendarEventWithParticipants[];
  onTimeSelect: (date: Date, hour: number, minute: number, isStart: boolean, e?: React.MouseEvent) => void;
  isSelecting: boolean;
  isTimeSlotSelected: (date: Date, hour: number, minute: number) => boolean;
  onSelectionEnd: () => void;
}

export function TimeGrid({ date, events, onTimeSelect, isSelecting, isTimeSlotSelected, onSelectionEnd }: TimeGridProps) {
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
        const hourEvents = getEventsForDateAndHour(date, hour);
        return (
          <div key={hour} className='relative h-[60px] w-full cursor-pointer'>
            {/* Add guide lines for 15-minute intervals */}
            <div className='pointer-events-none absolute inset-0 w-full'>
              {getMinuteIntervalsForHour().map((minute) => (
                <div key={`${hour}-${minute}`} className={cn('h-[15px] w-full', isTimeSlotSelected(date, hour, minute) && 'bg-primary/20', minute < 45 && 'border-b border-border/30')} />
              ))}
            </div>
            {/* Events */}
            <div className='relative z-10 p-1'>
              {hourEvents.map((event) => (
                <Button key={event.id} variant='ghost' className='h-auto w-full justify-start truncate rounded border border-dashed p-1 text-xs'>
                  {event.title}
                </Button>
              ))}
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
