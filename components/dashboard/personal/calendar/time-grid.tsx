import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
            {/* Add guide lines for 15-minute intervals */}
            <div className='pointer-events-none absolute inset-0 w-full'>
              {getMinuteIntervalsForHour().map((minute) => (
                <div key={`${hour}-${minute}`} className={cn('h-[15px] w-full', isTimeSlotSelected(date, hour, minute) && 'bg-primary/20', minute < 45 && 'border-b border-border/30')} />
              ))}
            </div>
            {/* Events */}
            <div className='relative z-10 p-1'>
              {hourEvents.map((event) => {
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
                                        {participant.participantType === 'contact' && <span className='text-blue-600'>Contact: {participant.name || 'Unknown'}</span>}
                                        {participant.participantType === 'user' && <span className='text-green-600'>User: {participant.name || 'Unknown'}</span>}
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
                        {(onEventEdit || onEventDelete) && (
                          <div className='flex justify-end gap-2'>
                            {onEventDelete && (
                              <Button size='sm' variant='destructive' onClick={() => onEventDelete(event.id)}>
                                Delete
                              </Button>
                            )}
                            {onEventEdit && (
                              <Button variant='outline' size='sm' onClick={() => onEventEdit(event)}>
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
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
