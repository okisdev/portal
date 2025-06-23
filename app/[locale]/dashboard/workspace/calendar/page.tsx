'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';
import { ThreeDayView } from '@/components/dashboard/workspace/calendar/3-day-view';
import { DayView } from '@/components/dashboard/workspace/calendar/day-view';
import { CalendarHeader } from '@/components/dashboard/workspace/calendar/header';
import { MonthView } from '@/components/dashboard/workspace/calendar/month-view';
import { CalendarSidePanel } from '@/components/dashboard/workspace/calendar/side-panel';
import { WeekView } from '@/components/dashboard/workspace/calendar/week-view';
import { ActionAlertDialog } from '@/components/shared/action-alert-dialog';
import { EventDialog } from '@/components/shared/event-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CalendarEventWithParticipants,
  CalendarFolder,
} from '@/lib/schema';
import { randomColor } from '@/utils/color';
import { api } from '@/utils/trpc/client';

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
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(
    (searchParams.get('view') as CalendarView) || 'month'
  );
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEventWithParticipants | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(
    new Set()
  );
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] =
    useState<CalendarFolder | null>(null);
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{
    date: Date;
    hour: number;
    minute: number;
  } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{
    date: Date;
    hour: number;
    minute: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDeleteEventDialogOpen, setIsDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const utils = api.useUtils();

  // Add effect to handle mobile view changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && view === 'week') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', '3days');
        router.push(`?${params.toString()}`);
        setView('3days');
      }
    };

    handleResize(); // Check on initial render
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view, router, searchParams]);

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const { data: folders, isLoading: isLoadingFolders } =
    api.calendar.getAllFolders.useQuery();
  const { data: events } = api.calendar.getEvents.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
  const { data: participantOptions } =
    api.calendar.getParticipantOptions.useQuery(undefined, {
      enabled: isEventDialogOpen,
    });

  const form = useForm({
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

  const calendarForm = useForm<{
    name: string;
    color: string;
    visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  }>({
    defaultValues: {
      name: '',
      color: '#000000',
      visibility: 'PRIVATE',
    },
  });

  const addCalendarForm = useForm<{
    name: string;
    color: string;
    visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  }>({
    defaultValues: {
      name: '',
      color: randomColor('hex'),
      visibility: 'PRIVATE',
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
      utils.calendar.getMyFolders.invalidate();
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
      utils.calendar.getMyFolders.invalidate();
    },
  });

  const deleteFolder = api.calendar.deleteFolder.useMutation({
    onSuccess: () => {
      utils.calendar.getMyFolders.invalidate();
    },
  });

  const handleEditEvent = (event: CalendarEventWithParticipants) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    setIsEventDialogOpen(true);
  };

  const handleCalendarSubmit = (data: {
    name: string;
    color: string;
    visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  }) => {
    if (selectedCalendar) {
      updateFolder.mutate({
        id: selectedCalendar.id,
        name: data.name,
        color: data.color,
        visibility: data.visibility,
      });
      setIsEditCalendarOpen(false);
      setSelectedCalendar(null);
      calendarForm.reset();
    }
  };

  const handleAddCalendarSubmit = (data: {
    name: string;
    color: string;
    visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  }) => {
    createFolder.mutate({
      name: data.name,
      color: data.color,
      visibility: data.visibility,
    });
    setIsAddCalendarOpen(false);
    addCalendarForm.reset();
  };

  const handleTimeSelection = (
    date: Date,
    hour: number,
    minute: number,
    isStart: boolean,
    e?: React.MouseEvent
  ) => {
    if (isStart && e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const minuteInBlock = Math.floor((relativeY / rect.height) * 60);
      const calculatedMinute = Math.floor(minuteInBlock / 15) * 15;
      setSelectionStart({
        date: new Date(date),
        hour,
        minute: calculatedMinute,
      });
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
      const [finalStartDate, finalEndDate] =
        startDate > endDate ? [endDate, startDate] : [startDate, endDate];

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
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
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
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
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

  const updateView = (newView: CalendarView) => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.push(`?${params.toString()}`);
    if (newView !== 'month') {
      setCurrentDate(new Date(selectedDate));
    } else {
      setCurrentDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      );
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteEventDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      toast.promise(deleteEvent.mutateAsync({ id: eventToDelete }), {
        loading: t('deleting_event'),
        success: t('event_deleted_successfully'),
        error: t('failed_to_delete_event'),
      });
      setEventToDelete(null);
    }
  };

  return (
    <>
      <div className='flex h-full flex-col md:flex-row'>
        <div className='hidden border-r md:block'>
          <CalendarSidePanel
            currentDate={currentDate}
            selectedDate={selectedDate}
            isLoading={isLoadingFolders}
            onDateSelect={(date) => {
              setSelectedDate(date);
              if (
                date.getMonth() !== currentDate.getMonth() ||
                date.getFullYear() !== currentDate.getFullYear()
              ) {
                setCurrentDate(date);
              }
            }}
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
                visibility: folder.visibility ?? 'PRIVATE',
              });
              setIsEditCalendarOpen(true);
            }}
            onDeleteCalendar={(folderId) => {
              toast.promise(deleteFolder.mutateAsync({ id: folderId }), {
                loading: t('deleting_calendar'),
                success: t('calendar_deleted_successfully'),
                error: t('failed_to_delete_calendar'),
              });
            }}
          />
        </div>

        <div className='flex flex-1 flex-col'>
          <CalendarHeader
            currentDate={currentDate}
            view={view}
            onViewChange={updateView}
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
              onEventDelete={handleDeleteEvent}
            />
          ) : view === 'week' ? (
            <WeekView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events ?? []}
              folders={folders ?? []}
              hiddenCalendars={hiddenCalendars}
              onTimeSelect={handleTimeSelection}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={finishSelection}
              onEventEdit={handleEditEvent}
              onEventDelete={handleDeleteEvent}
            />
          ) : view === '3days' ? (
            <ThreeDayView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events ?? []}
              folders={folders ?? []}
              hiddenCalendars={hiddenCalendars}
              onTimeSelect={handleTimeSelection}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={finishSelection}
              onEventEdit={handleEditEvent}
              onEventDelete={handleDeleteEvent}
            />
          ) : (
            <DayView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events ?? []}
              folders={folders ?? []}
              hiddenCalendars={hiddenCalendars}
              onTimeSelect={handleTimeSelection}
              isSelecting={isSelecting}
              isTimeSlotSelected={isTimeSlotSelected}
              onSelectionEnd={finishSelection}
              onEventEdit={handleEditEvent}
              onEventDelete={handleDeleteEvent}
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
            users: participantOptions.users.map((u) => ({
              id: u.id,
              name: u.name || '',
            })),
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
            <DialogTitle>{t('edit_calendar')}</DialogTitle>
          </DialogHeader>
          <Form {...calendarForm}>
            <form
              onSubmit={calendarForm.handleSubmit(handleCalendarSubmit)}
              className='space-y-4'
            >
              <FormField
                control={calendarForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
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
                    <FormLabel>{t('color')}</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Input
                          type='color'
                          {...field}
                          className='h-10 w-20 p-1'
                        />
                        <Input
                          {...field}
                          className='flex-1'
                          placeholder='#000000'
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={calendarForm.control}
                name='visibility'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('visibility')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_visibility')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PRIVATE'>{t('private')}</SelectItem>
                        <SelectItem value='SHARED'>{t('shared')}</SelectItem>
                        <SelectItem value='PUBLIC'>{t('public')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                  {t('cancel')}
                </Button>
                <Button type='submit' disabled={updateFolder.isPending}>
                  {updateFolder.isPending
                    ? t('saving_loading')
                    : t('save_changes')}
                </Button>
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
            <DialogTitle>{t('add_calendar_folder')}</DialogTitle>
          </DialogHeader>
          <Form {...addCalendarForm}>
            <form
              onSubmit={addCalendarForm.handleSubmit(handleAddCalendarSubmit)}
              className='space-y-4'
            >
              <FormField
                control={addCalendarForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('my_calendar')} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={addCalendarForm.control}
                name='color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('color')}</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-2'>
                        <Input
                          type='color'
                          {...field}
                          className='h-10 w-20 p-1'
                        />
                        <Input
                          {...field}
                          className='flex-1'
                          placeholder='#4f46e5'
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={addCalendarForm.control}
                name='visibility'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('visibility')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_visibility')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PRIVATE'>{t('private')}</SelectItem>
                        <SelectItem value='SHARED'>{t('shared')}</SelectItem>
                        <SelectItem value='PUBLIC'>{t('public')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                  {t('cancel')}
                </Button>
                <Button type='submit'>{t('create_calendar_folder')}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ActionAlertDialog
        open={isDeleteEventDialogOpen}
        onOpenChange={setIsDeleteEventDialogOpen}
        onConfirm={confirmDeleteEvent}
        title={t('delete_event')}
        description={t('delete_event_description')}
        cancelText={t('cancel')}
        confirmText={t('delete')}
      />
    </>
  );
}
