'use client';

import { YearMonthPicker } from '@/components/dashboard/personal/calendar/year-month-picker';
import { Combobox } from '@/components/shared/combobox';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { cn, generateUUID } from '@/lib/utils';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus, X } from 'lucide-react';
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
  participants: z
    .array(
      z.object({
        type: z.enum(['user', 'contact', 'external']),
        id: z.string().optional(),
        email: z.string().optional(),
        name: z.string().optional(),
        role: z.enum(['organizer', 'required', 'optional']).default('required'),
      })
    )
    .default([]),
});

export default function DashboardPersonalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [yearMonthPickerOpen, setYearMonthPickerOpen] = useState(false);
  const [isCalendarFolded, setIsCalendarFolded] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithParticipants | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(new Set());
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarFolder | null>(null);
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);

  const utils = api.useUtils();

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: folders } = api.calendar.getFolders.useQuery();
  const { data: events } = api.calendar.getEvents.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
  const { data: participantOptions } = api.calendar.getParticipantOptions.useQuery();

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
      participants: [],
    },
  });

  const calendarForm = useForm<{ name: string; color: string }>({
    defaultValues: {
      name: '',
      color: '#000000',
    },
  });

  const addCalendarForm = useForm<{ name: string; color: string }>({
    defaultValues: {
      name: '',
      color: '#4f46e5',
    },
  });

  // Update form values when selected date changes
  useEffect(() => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);

    if (!form.getValues('isAllDay')) {
      // For regular events, set end time to 1 hour after start
      endDate.setHours(endDate.getHours() + 1);
    } else {
      // For all-day events, set times to midnight
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
    }

    form.setValue('startAt', startDate);
    form.setValue('endAt', endDate);
  }, [selectedDate, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateEventOpen) {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);

      if (!form.getValues('isAllDay')) {
        // For regular events, set end time to 1 hour after start
        endDate.setHours(endDate.getHours() + 1);
      } else {
        // For all-day events, set times to midnight
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
      }

      form.reset({
        title: '',
        description: '',
        location: '',
        startAt: startDate,
        endAt: endDate,
        isAllDay: false,
        isPublic: false,
        folderId: folders?.[0]?.id ?? '',
        participants: [],
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

  const updateFolder = api.calendar.updateFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getFolders.invalidate();
    },
  });

  const deleteFolder = api.calendar.deleteFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getFolders.invalidate();
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

  const handleEditEvent = (event: CalendarEventWithParticipants) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    setIsCreateEventOpen(true);

    const startAt = new Date(event.startAt);
    const endAt = new Date(event.endAt);

    startAt.setHours(event.startAt.getHours(), event.startAt.getMinutes(), 0, 0);
    endAt.setHours(event.endAt.getHours(), event.endAt.getMinutes(), 0, 0);

    form.reset({
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      startAt: startAt,
      endAt: endAt,
      isAllDay: event.isAllDay ?? false,
      isPublic: event.isPublic ?? false,
      folderId: event.folderId,
      participants: event.participants.map((p) => ({
        type: p.participantType,
        role: p.role ?? 'required',
        id: p.participantId ?? undefined,
        email: p.email ?? undefined,
        name: p.name ?? undefined,
      })),
    });
  };

  const handleCalendarSubmit = (data: { name: string; color: string }) => {
    if (selectedCalendar) {
      updateFolder.mutate({
        id: selectedCalendar.id,
        name: data.name,
        color: data.color,
      });
      setIsEditCalendarOpen(false);
      setSelectedCalendar(null);
      calendarForm.reset();
    }
  };

  const handleAddCalendarSubmit = (data: { name: string; color: string }) => {
    createFolder.mutate({
      name: data.name,
      color: data.color,
    });
    setIsAddCalendarOpen(false);
    addCalendarForm.reset();
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

          <Button
            className='flex items-center gap-2'
            variant='outline'
            onClick={() => {
              addCalendarForm.reset();
              setIsAddCalendarOpen(true);
            }}
          >
            <Plus className='h-4 w-4' />
            Add calendar
          </Button>

          <div className='flex flex-col gap-2'>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <div className='flex cursor-pointer items-center gap-2' onClick={() => setIsCalendarFolded(!isCalendarFolded)}>
              <div className='flex-1 text-sm'>Calendars</div>
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isCalendarFolded && 'rotate-180')} />
            </div>
            {!isCalendarFolded && (
              <div className='flex w-full flex-col gap-2'>
                <div className='flex flex-col space-y-1'>
                  {folders?.map((folder) => (
                    <div key={folder.id} className='flex items-center gap-2'>
                      <Checkbox
                        checked={!hiddenCalendars.has(folder.id)}
                        onCheckedChange={(checked) => {
                          setHiddenCalendars((prev) => {
                            const next = new Set(prev);
                            if (checked) {
                              next.delete(folder.id);
                            } else {
                              next.add(folder.id);
                            }
                            return next;
                          });
                        }}
                      />
                      <Button
                        variant='ghost'
                        className='h-8 flex-1 justify-start px-2'
                        onClick={() => {
                          setHiddenCalendars((prev) => {
                            const next = new Set(prev);
                            if (next.has(folder.id)) {
                              next.delete(folder.id);
                            } else {
                              next.add(folder.id);
                            }
                            return next;
                          });
                        }}
                      >
                        <div className='mr-1 h-4 w-4 rounded-full' style={{ backgroundColor: folder.color ?? 'transparent' }} />
                        {folder.name}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0' onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCalendar(folder);
                              calendarForm.reset({
                                name: folder.name,
                                color: folder.color ?? '#000000',
                              });
                              setIsEditCalendarOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this calendar?')) {
                                deleteFolder.mutate(folder.id);
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                              </div>
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
                      );
                    })}
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

              <div className='flex gap-4'>
                <FormField
                  control={form.control}
                  name='isAllDay'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-center gap-2'>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='text-sm'>All Day</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='startAt'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        {form.watch('isAllDay') ? (
                          <DateTimePicker value={field.value} onChange={(date) => field.onChange(date)} showTimePicker={false} />
                        ) : (
                          <DateTimePicker value={field.value} onChange={(date) => field.onChange(date)} showTimePicker={true} />
                        )}
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
                        {form.watch('isAllDay') ? (
                          <DateTimePicker value={field.value} onChange={(date) => field.onChange(date)} showTimePicker={false} />
                        ) : (
                          <DateTimePicker value={field.value} onChange={(date) => field.onChange(date)} showTimePicker={true} />
                        )}
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

              <FormField
                control={form.control}
                name='isPublic'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='text-sm'>Public</FormLabel>
                  </FormItem>
                )}
              />

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-medium'>Participants</h3>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const participants = form.getValues('participants');
                      form.setValue('participants', [...participants, { type: 'external', email: '', name: '', role: 'required' }]);
                    }}
                  >
                    Add Participant
                  </Button>
                </div>

                {form.watch('participants').map((participant, index) => (
                  <div key={participant.id + generateUUID()} className='flex items-start gap-2'>
                    <FormField
                      control={form.control}
                      name={`participants.${index}.type`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <Select
                            value={field.value}
                            onValueChange={(value: 'user' | 'contact' | 'external') => {
                              field.onChange(value);
                              // Reset id when type changes
                              form.setValue(`participants.${index}.id`, undefined);
                              form.setValue(`participants.${index}.email`, undefined);
                              form.setValue(`participants.${index}.name`, undefined);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Type' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='user'>User</SelectItem>
                              <SelectItem value='contact'>Contact</SelectItem>
                              <SelectItem value='external'>External</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {participant.type === 'user' && (
                      <FormField
                        control={form.control}
                        name={`participants.${index}.id`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder='Select user' />
                              </SelectTrigger>
                              <SelectContent>
                                {participantOptions?.users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}

                    {participant.type === 'contact' && (
                      <FormField
                        control={form.control}
                        name={`participants.${index}.id`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder='Select contact' />
                              </SelectTrigger>
                              <SelectContent>
                                {participantOptions?.contacts.map((contact) => (
                                  <SelectItem key={contact.id} value={contact.id}>
                                    {contact.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}

                    {participant.type === 'external' && (
                      <>
                        <FormField
                          control={form.control}
                          name={`participants.${index}.email`}
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <Input {...field} placeholder='Email' />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.name`}
                          render={({ field }) => (
                            <FormItem className='flex-1'>
                              <Input {...field} placeholder='Name' />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name={`participants.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder='Role' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='organizer'>Organizer</SelectItem>
                              <SelectItem value='required'>Required</SelectItem>
                              <SelectItem value='optional'>Optional</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        const participants = form.getValues('participants');
                        form.setValue(
                          'participants',
                          participants.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
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

      <Dialog
        open={isEditCalendarOpen}
        onOpenChange={(open) => {
          setIsEditCalendarOpen(open);
          if (!open) {
            setSelectedCalendar(null);
            calendarForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Calendar</DialogTitle>
          </DialogHeader>
          <Form {...calendarForm}>
            <form onSubmit={calendarForm.handleSubmit(handleCalendarSubmit)} className='space-y-4'>
              <FormField
                control={calendarForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={calendarForm.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Input type='color' {...field} className='h-10 w-20 p-1' />
                        <Input {...field} className='flex-1' placeholder='#000000' />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsEditCalendarOpen(false);
                    setSelectedCalendar(null);
                    calendarForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type='submit'>Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddCalendarOpen}
        onOpenChange={(open) => {
          setIsAddCalendarOpen(open);
          if (!open) {
            addCalendarForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Calendar</DialogTitle>
          </DialogHeader>
          <Form {...addCalendarForm}>
            <form onSubmit={addCalendarForm.handleSubmit(handleAddCalendarSubmit)} className='space-y-4'>
              <FormField
                control={addCalendarForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='My Calendar' />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={addCalendarForm.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Input type='color' {...field} className='h-10 w-20 p-1' />
                        <Input {...field} className='flex-1' placeholder='#4f46e5' />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsAddCalendarOpen(false);
                    addCalendarForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type='submit'>Create Calendar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
