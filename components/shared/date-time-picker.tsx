'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';

export function DateTimePicker({ value, onChange, showTimePicker = true }: { value: Date; onChange: (date: Date) => void; showTimePicker?: boolean }) {
  function handleDateSelect(date: Date | undefined) {
    if (date) {
      const newDate = new Date(date);
      if (showTimePicker) {
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
      } else {
        // For all-day events, set time to start of day
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
      }
      onChange(newDate);
    }
  }

  function handleTimeChange(type: 'hour' | 'minute', timeValue: string) {
    const newDate = new Date(value);

    if (type === 'hour') {
      const hour = Number.parseInt(timeValue, 10);
      newDate.setHours(hour);
    } else if (type === 'minute') {
      const minute = Number.parseInt(timeValue, 10);
      newDate.setMinutes(minute);
    }

    onChange(newDate);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !value && 'text-muted-foreground')}>
            {value ? showTimePicker ? format(value, 'MM/dd/yyyy HH:mm') : format(value, 'MM/dd/yyyy') : <span>{showTimePicker ? 'MM/DD/YYYY HH:mm' : 'MM/DD/YYYY'}</span>}
            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <div className='sm:flex'>
          <Calendar mode='single' selected={value} onSelect={handleDateSelect} initialFocus />
          {showTimePicker && (
            <div className='flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0'>
              <ScrollArea className='w-64 sm:w-auto'>
                <div className='flex p-2 sm:flex-col'>
                  {Array.from({ length: 24 }, (_, i) => i)
                    .reverse()
                    .map((hour) => (
                      <Button
                        key={hour}
                        size='icon'
                        variant={value && value.getHours() === hour ? 'default' : 'ghost'}
                        className='aspect-square shrink-0 sm:w-full'
                        onClick={() => handleTimeChange('hour', hour.toString())}
                      >
                        {hour}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation='horizontal' className='sm:hidden' />
              </ScrollArea>
              <ScrollArea className='w-64 sm:w-auto'>
                <div className='flex p-2 sm:flex-col'>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size='icon'
                      variant={value && value.getMinutes() === minute ? 'default' : 'ghost'}
                      className='aspect-square shrink-0 sm:w-full'
                      onClick={() => handleTimeChange('minute', minute.toString())}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation='horizontal' className='sm:hidden' />
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
