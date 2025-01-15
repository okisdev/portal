'use client';

import { YearMonthPicker } from '@/components/dashboard/personal/calendar/year-month-picker';
import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { CalendarEvent } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.date(),
  endAt: z.date(),
  isAllDay: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  folderId: z.string(),
});

export default function DashboardPersonalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllCalendars, setShowAllCalendars] = useState(true);
  const [yearMonthPickerOpen, setYearMonthPickerOpen] = useState(false);
  const [isCalendarFolded, setIsCalendarFolded] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const utils = api.useUtils();

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: folders } = api.calendar.getFolders.useQuery();
  const { data: events } = api.calendar.getEvents.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startAt: selectedDate,
      endAt: selectedDate,
      isAllDay: false,
      isPublic: false,
      folderId: '',
    },
  });

  // Update form values when selected date changes
  useEffect(() => {
    form.setValue('startAt', selectedDate);
    form.setValue('endAt', selectedDate);
  }, [selectedDate, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateEventOpen) {
      form.reset({
        title: '',
        description: '',
        location: '',
        startAt: selectedDate,
        endAt: selectedDate,
        isAllDay: false,
        isPublic: false,
        folderId: folders?.[0]?.id ?? '',
      });
    }
  }, [isCreateEventOpen, selectedDate, folders, form]);

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsCreateEventOpen(false);
      form.reset();
    },
  });

  const createFolder = api.calendar.createFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getFolders.invalidate();
    },
  });

  const updateEvent = api.calendar.updateEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsCreateEventOpen(false);
      setSelectedEvent(null);
      setIsEditMode(false);
      form.reset();
    },
  });

  const deleteEvent = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsCreateEventOpen(false);
      setSelectedEvent(null);
      setIsEditMode(false);
      form.reset();
    },
  });

  const handleCalendarSelect = async (value: string) => {
    // If the folder doesn't exist, create it
    if (!folders?.some((folder) => folder.name === value)) {
      await createFolder.mutateAsync({
        name: value,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
      });
    }

    // Find the folder id or wait for the folders to refresh
    const folder = folders?.find((f) => f.name === value);
    if (folder) {
      form.setValue('folderId', folder.id);
    }
  };

  const onSubmit = (data: z.infer<typeof eventFormSchema>) => {
    if (isEditMode && selectedEvent) {
      updateEvent.mutate({
        id: selectedEvent.id,
        ...data,
      });
    } else {
      createEvent.mutate(data);
    }
  };

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

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    setIsCreateEventOpen(true);
    form.reset({
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      startAt: new Date(event.startAt),
      endAt: new Date(event.endAt),
      isAllDay: event.isAllDay ?? false,
      isPublic: event.isPublic ?? false,
      folderId: event.folderId,
    });
  };

  return (
    <>
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
                    date.getDate() === selectedDate.getDate() &&
                      date.getMonth() === selectedDate.getMonth() &&
                      date.getFullYear() === selectedDate.getFullYear() &&
                      'bg-primary text-primary-foreground'
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
              <div className='flex w-full flex-col gap-2'>
                <div className='flex flex-col gap-2'>
                  {folders?.map((folder) => (
                    <Button key={folder.id} variant='ghost' className='w-full justify-start'>
                      <div className='mr-2 h-4 w-4 rounded-full' style={{ backgroundColor: folder.color ?? 'transparent' }} />
                      {folder.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className='flex items-center gap-2'>
              <Checkbox checked={showAllCalendars} onClick={() => setShowAllCalendars(!showAllCalendars)} />
              <Label className='text-sm'>Show All events</Label>
            </div>
          </div>
        </div>

        <div className='flex flex-1 flex-col'>
          <header className='flex items-center justify-between border-b px-4 py-2'>
            <div className='flex items-center gap-4'>
              <Button variant='outline' onClick={goToToday} className='h-8'>
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
              <h1 className='text-lg'>
                {currentDate.getFullYear()} {MONTHS[currentDate.getMonth()]}
              </h1>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' className='h-8 w-auto' onClick={() => setIsCreateEventOpen(true)}>
                <Plus className='h-4 w-4' />
                Add event
              </Button>
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
                            {event.isAllDay ? 'All day' : `${new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} {event.title}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-80'>
                          <div className='grid gap-4'>
                            <div className='space-y-2'>
                              <h4 className='font-medium leading-none'>{event.title}</h4>
                              <p className='text-sm text-muted-foreground'>
                                {event.isAllDay
                                  ? 'All day'
                                  : `${new Date(event.startAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`}
                              </p>
                            </div>
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
                            <div className='flex justify-end'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  handleEditEvent(event);
                                }}
                              >
                                Edit
                              </Button>
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

      <Dialog
        open={isCreateEventOpen}
        onOpenChange={(open) => {
          setIsCreateEventOpen(open);
          if (!open) {
            setSelectedEvent(null);
            setIsEditMode(false);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='startAt'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <Input
                          type='datetime-local'
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='endAt'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <Input
                          type='datetime-local'
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='folderId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar</FormLabel>
                    <FormControl>
                      <Combobox
                        value={folders?.find((f) => f.id === field.value)?.name || ''}
                        onChange={handleCalendarSelect}
                        items={folders?.map((f) => f.name) || []}
                        placeholder='Select or create calendar'
                        searchPlaceholder='Search calendars...'
                        emptyText='No calendars found'
                        groupHeading='Calendars'
                        allowCustom={true}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='flex gap-4'>
                <FormField
                  control={form.control}
                  name='isAllDay'
                  render={({ field }) => (
                    <FormItem className='flex items-center gap-2'>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>All Day</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='isPublic'
                  render={({ field }) => (
                    <FormItem className='flex items-center gap-2'>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Public</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex gap-2'>
                {isEditMode && (
                  <Button
                    type='button'
                    variant='destructive'
                    className='w-full'
                    onClick={() => {
                      if (selectedEvent) {
                        deleteEvent.mutate(selectedEvent.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
                <Button type='submit' className='w-full'>
                  {isEditMode ? 'Update' : 'Create'} Event
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
