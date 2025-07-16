import { useTranslations } from 'next-intl';
import { NameTag } from '@/components/shared/name-tag';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  CalendarEventWithParticipants,
  CalendarFolder,
} from '@/lib/schema';

interface EventPopoverProps {
  event: CalendarEventWithParticipants;
  folder?: CalendarFolder;
  onEventEdit?: (event: CalendarEventWithParticipants) => void;
  onEventDelete?: (eventId: string) => void;
  onEventClick?: (e: React.MouseEvent) => void;
}

export function EventPopover({
  event,
  folder,
  onEventEdit,
  onEventDelete,
  onEventClick,
}: EventPopoverProps) {
  const t = useTranslations();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className='h-auto w-full justify-start truncate rounded p-1 text-foreground text-xs'
          onClick={(e) => {
            e.stopPropagation();
            onEventClick?.(e);
          }}
          style={{ backgroundColor: `${folder?.color}20` }}
          variant='ghost'
        >
          {event.isAllDay ? (
            t('all_day')
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
      <PopoverContent className='w-80'>
        <div className='grid gap-2'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <div
                className='h-3 w-3 rounded-full'
                style={{ backgroundColor: folder?.color ?? 'transparent' }}
              />
              <h4 className='font-medium leading-none'>{event.title}</h4>
            </div>
            <p className='text-muted-foreground text-sm'>
              {event.isAllDay ? (
                t('all_day')
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
                  <p className='text-sm'>{t('description')}:</p>
                  <p className='col-span-2 text-sm'>{event.description}</p>
                </div>
              </div>
            )}
            {event.location && (
              <div className='grid gap-2'>
                <div className='grid grid-cols-3 items-center gap-4'>
                  <p className='text-sm'>{t('location')}:</p>
                  <p className='col-span-2 text-sm'>{event.location}</p>
                </div>
              </div>
            )}
            <div className='grid gap-2'>
              <div className='grid grid-cols-3 items-center gap-4'>
                <p className='text-sm'>{t('created_by')}:</p>
                <div className='col-span-2 text-sm'>
                  <NameTag id={event.userId} type='user' />
                </div>
              </div>
            </div>
            {event.participants && event.participants.length > 0 && (
              <div className='grid gap-2'>
                <div className='grid grid-cols-3 items-center gap-4'>
                  <p className='text-sm'>{t('participants')}:</p>
                  <div className='col-span-2 space-y-1'>
                    {event.participants.map((participant) => (
                      <div
                        className='flex items-center justify-between text-sm'
                        key={participant.id}
                      >
                        <span>
                          {participant.participantType === 'contact' &&
                            participant.participantId && (
                              <NameTag
                                id={participant.participantId}
                                type='contact'
                              />
                            )}
                          {participant.participantType === 'user' &&
                            participant.participantId && (
                              <NameTag
                                id={participant.participantId}
                                type='user'
                              />
                            )}
                          {participant.participantType === 'external' && (
                            <span className='text-orange-600'>
                              {t('external')}: {participant.name} (
                              {participant.email})
                            </span>
                          )}
                        </span>
                        <span className='text-muted-foreground text-xs capitalize'>
                          {t(participant.status || '')}
                        </span>
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
                <Button
                  onClick={() => onEventDelete(event.id)}
                  size='sm'
                  variant='destructive'
                >
                  {t('delete')}
                </Button>
              )}
              {onEventEdit && (
                <Button
                  onClick={() => onEventEdit(event)}
                  size='sm'
                  variant='outline'
                >
                  {t('edit')}
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
