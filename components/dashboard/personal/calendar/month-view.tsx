import { NameTag } from '@/components/shared/name-tag';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
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

export function MonthView({ currentDate, selectedDate, setSelectedDate, events, folders, hiddenCalendars, onEventEdit, onEventDelete }: MonthViewProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events?.filter((event) => event.startAt.getDate() === date.getDate() && event.startAt.getMonth() === date.getMonth() && event.startAt.getFullYear() === date.getFullYear()) ?? [];
  };

  return (
    <div className='grid flex-1 grid-cols-7'>
      {WEEKDAYS.map((day) => (
        <div key={day} className='border-r border-b p-2 text-muted-foreground text-sm'>
          {day}
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
              date.getMonth() !== currentDate.getMonth() && 'bg-muted/50',
              date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() && 'ring-2 ring-primary ring-inset'
            )}
            onClick={() => setSelectedDate(date)}
          >
            <span
              className={cn(
                'text-sm',
                date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear() &&
                  'inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
              )}
            >
              {date.getDate()}
            </span>
            {events
              .filter((event) => !hiddenCalendars.has(event.folderId))
              .map((event) => {
                const folder = folders?.find((f) => f.id === event.folderId);

                return (
                  <Popover key={event.id}>
                    <PopoverTrigger asChild>
                      <Button
                        variant='ghost'
                        className='h-auto w-full justify-start truncate rounded border border-dashed p-1 text-xs'
                        style={{
                          backgroundColor: `${folder?.color}20`,
                          borderColor: folder?.color ?? 'transparent',
                          color: folder?.color ?? 'inherit',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.isAllDay ? (
                          'All day'
                        ) : (
                          <>
                            {new Date(event.startAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                            {' - '}
                            {new Date(event.endAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </>
                        )}{' '}
                        {event.title}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent id='popover-content' className='w-80'>
                      <div className='grid gap-2'>
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <div className='h-3 w-3 rounded-full' style={{ backgroundColor: folder?.color ?? 'transparent' }} />
                            <h4 className='font-medium leading-none'>{event.title}</h4>
                          </div>
                          <p className='text-muted-foreground text-sm'>
                            {event.isAllDay ? (
                              'All day'
                            ) : (
                              <>
                                {new Date(event.startAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                                {' - '}
                                {new Date(event.endAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })}
                              </>
                            )}
                          </p>
                        </div>
                        <div className='space-y-2'>
                          {event.description && (
                            <div className='grid gap-2'>
                              <div className='grid grid-cols-3 items-center gap-4'>
                                <p className='text-sm'>Description:</p>
                                <p className='col-span-2 text-sm'>{event.description}</p>
                              </div>
                            </div>
                          )}
                          {event.location && (
                            <div className='grid gap-2'>
                              <div className='grid grid-cols-3 items-center gap-4'>
                                <p className='text-sm'>Location:</p>
                                <p className='col-span-2 text-sm'>{event.location}</p>
                              </div>
                            </div>
                          )}
                          {event.participants && event.participants.length > 0 && (
                            <div className='grid gap-2'>
                              <div className='grid grid-cols-3 items-center gap-4'>
                                <p className='text-sm'>Participants:</p>
                                <div className='col-span-2 space-y-1'>
                                  {event.participants.map((participant) => (
                                    <div key={participant.id} className='flex items-center justify-between text-sm'>
                                      <span>
                                        {participant.participantType === 'contact' && participant.participantId && <NameTag id={participant.participantId} type='contact' />}
                                        {participant.participantType === 'user' && participant.participantId && <NameTag id={participant.participantId} type='user' />}
                                        {participant.participantType === 'external' && (
                                          <span className='text-orange-600'>
                                            External: {participant.name} ({participant.email})
                                          </span>
                                        )}
                                      </span>
                                      <span className='text-muted-foreground text-xs capitalize'>{participant.status}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className='flex justify-end gap-2'>
                          <Button size='sm' variant='destructive' onClick={() => onEventDelete(event.id)}>
                            Delete
                          </Button>
                          <Button variant='outline' size='sm' onClick={() => onEventEdit(event)}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
