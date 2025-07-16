'use client';

import { format, isFuture, isPast, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  Edit2,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { EventFormData } from '@/components/shared/event-dialog';
import { EventDialog } from '@/components/shared/event-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
}

interface EventSectionProps {
  appointments: Appointment[];
  calendarFolders?: any[];
  onCreateAppointment: (data: EventFormData) => void;
  onUpdateAppointment: (data: any) => void;
  onDeleteAppointment: (id: string) => void;
  defaultTitle?: string;
}

export function EventSection({
  appointments,
  calendarFolders,
  onCreateAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  defaultTitle,
}: EventSectionProps) {
  const t = useTranslations();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<{
    id: string;
    title: string;
    description: string;
    startAt: Date;
  } | null>(null);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isPastOpen, setIsPastOpen] = useState(false);

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  const handleEditAppointment = (data: any) => {
    if (!editingAppointment) return;
    onUpdateAppointment({
      id: editingAppointment.id,
      ...data,
    });
    setEditingAppointment(null);
  };

  const upcomingAppointments = appointments
    .filter((apt) => isFuture(new Date(apt.startAt)))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  const pastAppointments = appointments
    .filter((apt) => isPast(new Date(apt.startAt)))
    .sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );
  const todayAppointments = appointments.filter((apt) =>
    isToday(new Date(apt.startAt))
  );

  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-between'>
        <h2 className='font-medium text-foreground'>{t('meetings')}</h2>
        <Button onClick={handleOpenBookingModal} size='icon' variant='ghost'>
          <Plus className='h-4 w-4' />
        </Button>
      </div>

      <div className='space-y-2'>
        {todayAppointments.length > 0 && (
          <div className='space-y-1'>
            <p className='font-medium text-muted-foreground text-sm'>{`${t('today')}  (${todayAppointments.length})`}</p>
            <AnimatePresence initial={false}>
              {todayAppointments.map((apt) => (
                <motion.div
                  animate={{ opacity: 1, height: 'auto' }}
                  className='flex items-center gap-3 rounded-md border bg-card px-3 py-2'
                  exit={{ opacity: 0, height: 0 }}
                  initial={{ opacity: 0, height: 0 }}
                  key={apt.id}
                >
                  <Calendar className='h-4 w-4 shrink-0 text-primary' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium text-sm'>{apt.title}</p>
                    <p className='text-muted-foreground text-xs'>
                      {format(new Date(apt.startAt), 'p')} -{' '}
                      {format(new Date(apt.endAt), 'p')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className='h-8 w-8' size='icon' variant='ghost'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem
                        onClick={() =>
                          setEditingAppointment({
                            id: apt.id,
                            title: apt.title,
                            description: apt.description || '',
                            startAt: new Date(apt.startAt),
                          })
                        }
                      >
                        <Edit2 className='mr-2 h-4 w-4' />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() => onDeleteAppointment(apt.id)}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className='space-y-1'>
          <button
            className='flex w-full items-center justify-between rounded-md px-1 py-1 hover:bg-accent'
            onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
            type='button'
          >
            <p className='font-medium text-muted-foreground text-sm'>
              {t('upcoming_meetings')}
              {upcomingAppointments.length > 0 && (
                <span className='ml-2 text-primary text-sm'>
                  ({upcomingAppointments.length})
                </span>
              )}
            </p>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isUpcomingOpen ? 'rotate-180' : ''
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {isUpcomingOpen && (
              <motion.div
                animate={{ opacity: 1, height: 'auto' }}
                className='space-y-1 pt-1'
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
              >
                {upcomingAppointments.length === 0 ? (
                  <p className='px-1 text-muted-foreground text-xs'>
                    {t('no_upcoming_meetings')}
                  </p>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <motion.div
                      animate={{ opacity: 1, height: 'auto' }}
                      className='flex items-center gap-3 rounded-md border bg-card px-3 py-2'
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      key={apt.id}
                    >
                      <Calendar className='h-4 w-4 shrink-0 text-primary' />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium text-sm'>
                          {apt.title}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {format(new Date(apt.startAt), 'PPp')} -{' '}
                          {format(new Date(apt.endAt), 'PPp')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className='h-8 w-8'
                            size='icon'
                            variant='ghost'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingAppointment({
                                id: apt.id,
                                title: apt.title,
                                description: apt.description || '',
                                startAt: new Date(apt.startAt),
                              })
                            }
                          >
                            <Edit2 className='mr-2 h-4 w-4' />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => onDeleteAppointment(apt.id)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className='space-y-1'>
          <button
            className='flex w-full items-center justify-between rounded-md px-1 py-1 hover:bg-accent'
            onClick={() => setIsPastOpen(!isPastOpen)}
            type='button'
          >
            <span className='font-medium text-muted-foreground text-sm'>
              {t('past_meetings')}
              {pastAppointments.length > 0 && (
                <span className='ml-2 text-muted-foreground text-xs'>
                  ({pastAppointments.length})
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isPastOpen ? 'rotate-180' : ''
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {isPastOpen && (
              <motion.div
                animate={{ opacity: 1, height: 'auto' }}
                className='space-y-1 pt-1'
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
              >
                {pastAppointments.length === 0 ? (
                  <p className='px-1 text-muted-foreground text-xs'>
                    {t('no_past_meetings')}
                  </p>
                ) : (
                  pastAppointments.map((apt) => (
                    <motion.div
                      animate={{ opacity: 1, height: 'auto' }}
                      className='flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2'
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      key={apt.id}
                    >
                      <Calendar className='h-4 w-4 shrink-0 text-muted-foreground' />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-medium text-muted-foreground text-sm'>
                          {apt.title}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {format(new Date(apt.startAt), 'PPp')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className='h-8 w-8'
                            size='icon'
                            variant='ghost'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              setEditingAppointment({
                                id: apt.id,
                                title: apt.title,
                                description: apt.description || '',
                                startAt: new Date(apt.startAt),
                              })
                            }
                          >
                            <Edit2 className='mr-2 h-4 w-4' />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => onDeleteAppointment(apt.id)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <EventDialog
        defaultValues={
          editingAppointment
            ? {
                title: editingAppointment.title,
                description: editingAppointment.description,
                startAt: new Date(editingAppointment.startAt),
                endAt: new Date(
                  editingAppointment.startAt.getTime() + 30 * 60_000
                ),
              }
            : undefined
        }
        folders={calendarFolders}
        isEditMode={true}
        key={editingAppointment?.id}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        onSubmit={handleEditAppointment}
        open={!!editingAppointment}
      />

      <EventDialog
        defaultValues={{
          title: defaultTitle || '',
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 60_000),
          folderId: 'default',
        }}
        folders={calendarFolders}
        onOpenChange={setIsBookingModalOpen}
        onSubmit={onCreateAppointment}
        open={isBookingModalOpen}
      />
    </div>
  );
}
