'use client';

import { ThreeDayView } from '@/components/dashboard/personal/calendar/3-day-view';
import { DayView } from '@/components/dashboard/personal/calendar/day-view';
import { CalendarHeader } from '@/components/dashboard/personal/calendar/header';
import { MonthView } from '@/components/dashboard/personal/calendar/month-view';
import { CalendarSidebar } from '@/components/dashboard/personal/calendar/sidebar';
import { WeekView } from '@/components/dashboard/personal/calendar/week-view';
import { EventDialog } from '@/components/shared/event-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CalendarEventWithParticipants, CalendarFolder } from '@/lib/schema';
import { api } from '@/utils/trpc/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

type CalendarView = 'month' | 'week' | '3days' | 'day';

export default function DashboardPersonalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventWithParticipants | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(new Set());
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarFolder | null>(null);
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

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

  useEffect(() => {
    if (!isEventDialogOpen) {
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
  }, [isEventDialogOpen, selectedDate, folders, form]);

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsEventDialogOpen(false);
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
      setIsEventDialogOpen(false);
      setSelectedEvent(null);
      setIsEditMode(false);
      form.reset();
    },
  });

  const deleteEvent = api.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getEvents.invalidate();
      setIsEventDialogOpen(false);
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

  const handleEditEvent = (event: CalendarEventWithParticipants) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    setIsEventDialogOpen(true);

    form.reset({
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      startAt: event.startAt,
      endAt: event.endAt,
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

  const handleTimeSelection = (date: Date, hour: number, minute: number, isStart: boolean, e?: React.MouseEvent) => {
    if (isStart && e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const minuteInBlock = Math.floor((relativeY / rect.height) * 60);
      const calculatedMinute = Math.floor(minuteInBlock / 15) * 15;
      setSelectionStart({ date: new Date(date), hour, minute: calculatedMinute });
      setSelectionEnd({ date: new Date(date), hour, minute: calculatedMinute });
      setIsSelecting(true);
    } else if (isSelecting && e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const minuteInBlock = Math.floor((relativeY / rect.height) * 60);
      const calculatedMinute = Math.floor(minuteInBlock / 15) * 15;
      setSelectionEnd({ date: new Date(date), hour, minute: calculatedMinute });
    }
  };

  const finishSelection = () => {
    if (selectionStart && selectionEnd && isSelecting) {
      const startDate = new Date(selectionStart.date);
      startDate.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
      const endDate = new Date(selectionEnd.date);
      endDate.setHours(selectionEnd.hour, selectionEnd.minute, 0, 0);

      // Ensure start is before end
      const [finalStartDate, finalEndDate] = startDate > endDate ? [endDate, startDate] : [startDate, endDate];

      setSelectedDate(finalStartDate);
      form.reset({
        ...form.getValues(),
        startAt: finalStartDate,
        endAt: finalEndDate,
        folderId: folders?.[0]?.id ?? '',
      });
      setIsEventDialogOpen(true);
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const isTimeSlotSelected = (date: Date, hour: number, minute: number) => {
    if (!selectionStart || !selectionEnd || !isSelecting) return false;

    const timeSlot = new Date(date);
    timeSlot.setHours(hour, minute, 0, 0);

    const start = new Date(selectionStart.date);
    start.setHours(selectionStart.hour, selectionStart.minute, 0, 0);
    const end = new Date(selectionEnd.date);
    end.setHours(selectionEnd.hour, selectionEnd.minute, 0, 0);

    if (start > end) {
      return timeSlot >= end && timeSlot <= start;
    }
    return timeSlot >= start && timeSlot <= end;
  };

  const goToToday = () => {
    const today = new Date();
    if (view === 'month') {
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else {
      setCurrentDate(today);
    }
    setSelectedDate(today);
  };

  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (view === '3days') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 3);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (view === '3days') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 3);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  return (
    <>
      <div className='flex h-full'>
        <CalendarSidebar
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          folders={folders ?? []}
          hiddenCalendars={hiddenCalendars}
          onToggleCalendar={(folderId) => {
            setHiddenCalendars((prev) => {
              const next = new Set(prev);
              if (next.has(folderId)) {
                next.delete(folderId);
              } else {
                next.add(folderId);
              }
              return next;
            });
          }}
          onAddCalendar={() => {
            addCalendarForm.reset();
            setIsAddCalendarOpen(true);
          }}
          onEditCalendar={(folder) => {
            setSelectedCalendar(folder);
            calendarForm.reset({
              name: folder.name,
              color: folder.color ?? '#000000',
            });
            setIsEditCalendarOpen(true);
          }}
          onDeleteCalendar={(folderId) => {
            if (window.confirm('Are you sure you want to delete this calendar?')) {
              deleteFolder.mutate(folderId);
            }
          }}
        />

        <div className='flex flex-1 flex-col'>
          <CalendarHeader
            currentDate={currentDate}
            view={view}
            onViewChange={setView}
            onTodayClick={goToToday}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onAddEvent={() => setIsEventDialogOpen(true)}
          />

          {view === 'month' ? (
            <MonthView
              currentDate={currentDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              events={events ?? []}
              folders={folders ?? []}
              hiddenCalendars={hiddenCalendars}
              onEventEdit={handleEditEvent}
              onEventDelete={(eventId) => {
                toast.promise(deleteEvent.mutateAsync(eventId), {
                  loading: 'Deleting event...',
                  success: 'Event deleted successfully',
                  error: 'Failed to delete event',
                });
              }}
            />
          ) : view === 'week' ? (
            <WeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events ?? []}
              onTimeSelect={handleTimeSelection}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={finishSelection}
            />
          ) : view === '3days' ? (
            <ThreeDayView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events ?? []}
              onTimeSelect={handleTimeSelection}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={finishSelection}
            />
          ) : (
            <DayView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events ?? []}
              onTimeSelect={handleTimeSelection}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={finishSelection}
            />
          )}
        </div>
      </div>

      <EventDialog
        open={isEventDialogOpen}
        onOpenChange={(open) => {
          setIsEventDialogOpen(open);
          if (!open) {
            setSelectedEvent(null);
            setIsEditMode(false);
          }
        }}
        onSubmit={(data) => {
          if (isEditMode && selectedEvent) {
            updateEvent.mutate({
              id: selectedEvent.id,
              ...data,
            });
          } else {
            createEvent.mutate(data);
          }
        }}
        isEditMode={isEditMode}
        defaultValues={
          selectedEvent
            ? {
                title: selectedEvent.title,
                description: selectedEvent.description ?? '',
                location: selectedEvent.location ?? '',
                startAt: selectedEvent.startAt,
                endAt: selectedEvent.endAt,
                isAllDay: selectedEvent.isAllDay ?? false,
                isPublic: selectedEvent.isPublic ?? false,
                folderId: selectedEvent.folderId,
                participants: selectedEvent.participants.map((p) => ({
                  type: p.participantType,
                  role: p.role ?? 'required',
                  id: p.participantId ?? undefined,
                  email: p.email ?? undefined,
                  name: p.name ?? undefined,
                })),
              }
            : {
                startAt: selectedDate,
                endAt: new Date(selectedDate.getTime() + 60 * 60 * 1000),
                folderId: folders?.[0]?.id ?? '',
              }
        }
        folders={folders}
        participantOptions={
          participantOptions && {
            users: participantOptions.users.map((u) => ({ id: u.id, name: u.name || '' })),
            contacts: participantOptions.contacts,
          }
        }
        onCreateFolder={async (name) => {
          await createFolder.mutateAsync({
            name,
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          });
        }}
      />

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
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
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
        <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
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
