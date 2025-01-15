'use client';

import { YearMonthPicker } from '@/components/dashboard/personal/calendar/year-month-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import * as React from 'react';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Event {
  id: string;
  title: string;
  time: string;
  date: Date;
  description?: string;
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Pre-collec',
    time: '13:00',
    date: new Date(2025, 0, 3),
    description: 'Pre-collection meeting with the team',
  },
  {
    id: '2',
    title: 'Insurtecl',
    time: '8:00',
    date: new Date(2025, 0, 4),
    description: 'Insurance technology conference call',
  },
  {
    id: '3',
    title: 'Insurtecl',
    time: '8:00',
    date: new Date(2025, 0, 5),
    description: 'Follow-up on insurance technology implementation',
  },
];

export default function DashboardCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [showAllCalendars, setShowAllCalendars] = React.useState(true);
  const [yearMonthPickerOpen, setYearMonthPickerOpen] = React.useState(false);
  const [isCalendarFolded, setIsCalendarFolded] = React.useState(false);

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
    return SAMPLE_EVENTS.filter((event) => event.date.getDate() === date.getDate() && event.date.getMonth() === date.getMonth() && event.date.getFullYear() === date.getFullYear());
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className='flex'>
      <div className='flex w-64 flex-col gap-4 border-r p-4'>
        <div className='flex items-center justify-between'>
          <Popover open={yearMonthPickerOpen} onOpenChange={setYearMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant='outline' className='w-full justify-start' onClick={() => setYearMonthPickerOpen(true)}>
                <span>
                  {currentDate.getFullYear()} {MONTHS[currentDate.getMonth()]}
                </span>
                <ChevronDown className='ml-auto h-4 w-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <YearMonthPicker
                value={currentDate}
                onChange={(date) => {
                  setCurrentDate(date);
                  setYearMonthPickerOpen(false);
                }}
                onClose={() => setYearMonthPickerOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className='grid grid-cols-7 gap-1 text-sm'>
          {WEEKDAYS.map((day) => (
            <div key={day} className='text-center text-muted-foreground'>
              {day.slice(0, 1)}
            </div>
          ))}
          {getDaysInMonth(currentDate)
            .slice(0, 35)
            .map((date) => (
              <Button
                key={date.toISOString()}
                variant='ghost'
                className={cn(
                  'h-6 w-6 p-0',
                  date.getMonth() !== currentDate.getMonth() && 'text-muted-foreground',
                  date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear() && 'bg-primary text-primary-foreground'
                )}
                onClick={() => setSelectedDate(date)}
              >
                {date.getDate()}
              </Button>
            ))}
        </div>

        <Button className='flex items-center gap-2' variant='outline'>
          <Plus className='h-4 w-4' />
          Add calendar
        </Button>

        <div className='flex flex-col gap-2'>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div className='flex cursor-pointer items-center gap-2' onClick={() => setIsCalendarFolded(!isCalendarFolded)}>
            <div className='flex-1'>Calendars</div>
            <ChevronDown className='h-4 w-4' />
          </div>
          {!isCalendarFolded && (
            <div>
              <Button variant='ghost' className='justify-start'>
                Work
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className='flex items-center gap-2'>
            <Checkbox checked={showAllCalendars} onClick={() => setShowAllCalendars(!showAllCalendars)} />
            <div className='flex-1'>Show All events</div>
          </div>
        </div>
      </div>

      <div className='flex flex-1 flex-col'>
        <header className='flex items-center justify-between border-b p-4'>
          <div className='flex items-center gap-4'>
            <Button variant='outline' onClick={goToToday}>
              Today
            </Button>
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='icon' onClick={goToPreviousMonth}>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' onClick={goToNextMonth}>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
            <h1 className='text-xl'>
              {currentDate.getFullYear()} {MONTHS[currentDate.getMonth()]}
            </h1>
          </div>
        </header>

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
                {showAllCalendars &&
                  events.map((event) => (
                    <Popover key={event.id}>
                      <PopoverTrigger asChild>
                        <Button
                          variant='ghost'
                          className='h-auto w-full justify-start truncate rounded border border-blue-300 border-dashed bg-blue-100 p-1 text-blue-700 text-xs hover:bg-blue-200'
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.time} {event.title}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-80'>
                        <div className='grid gap-4'>
                          <div className='space-y-2'>
                            <h4 className='font-medium leading-none'>{event.title}</h4>
                            <p className='text-muted-foreground text-sm'>{event.time}</p>
                          </div>
                          <div className='grid gap-2'>
                            <div className='grid grid-cols-3 items-center gap-4'>
                              <p className='text-sm'>Description:</p>
                              <p className='col-span-2 text-sm'>{event.description}</p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
