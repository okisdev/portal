import { NameTag } from '@/components/shared/name-tag';
import { Button } from '@/components/ui/button';
import { PopoverContent } from '@/components/ui/popover';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { useTranslations } from 'next-intl';

interface EventPopoverProps {
  event: CalendarEventWithParticipants;
  folder?: CalendarFolder;
  onEventEdit?: (event: CalendarEventWithParticipants) => void;
  onEventDelete?: (eventId: string) => void;
}

export function EventPopover({ event, folder, onEventEdit, onEventDelete }: EventPopoverProps) {
  const t = useTranslations();

  return (
    <PopoverContent className='w-80'>
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
          <div className='grid gap-2'>
            <div className='grid grid-cols-3 items-center gap-4'>
              <p className='text-sm'>Created by:</p>
              <div className='col-span-2 text-sm'>
                <NameTag id={event.userId} type='user' />
              </div>
            </div>
          </div>
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
        {(onEventEdit || onEventDelete) && (
          <div className='flex justify-end gap-2'>
            {onEventDelete && (
              <Button size='sm' variant='destructive' onClick={() => onEventDelete(event.id)}>
                {t('delete')}
              </Button>
            )}
            {onEventEdit && (
              <Button variant='outline' size='sm' onClick={() => onEventEdit(event)}>
                {t('edit')}
              </Button>
            )}
          </div>
        )}
      </div>
    </PopoverContent>
  );
}
