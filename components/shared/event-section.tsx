'use client';

import { EventDialog } from '@/components/shared/event-dialog';
import type { EventFormData } from '@/components/shared/event-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, Edit2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
}

interface EventSectionProps {
  appointments: Appointment[];
  calendarFolders?: any[];
  onCreateAppointment: (data: EventFormData) => void;
  onUpdateAppointment: (data: any) => void;
  onDeleteAppointment: (id: string) => void;
  defaultTitle?: string;
}

export function EventSection({ appointments, calendarFolders, onCreateAppointment, onUpdateAppointment, onDeleteAppointment, defaultTitle }: EventSectionProps) {
  const t = useTranslations();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<{
    id: string;
    title: string;
    description: string;
    startAt: Date;
  } | null>(null);
  const [isPastMeetingsOpen, setIsPastMeetingsOpen] = useState(false);
  const [isUpcomingMeetingsOpen, setIsUpcomingMeetingsOpen] = useState(true);

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

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <h2 className='font-medium text-foreground'>{t('meetings')}</h2>
        <button type='button' className='text-muted-foreground hover:text-foreground' onClick={handleOpenBookingModal}>
          <Plus className='size-4' />
        </button>
      </div>
      <div className='space-y-4'>
        {!appointments || (appointments.length === 0 && <p className='text-muted-foreground text-sm'>{t('no_meetings_found')}</p>)}
        {appointments && appointments.length > 0 && (
          <div className='space-y-4'>
            <Collapsible open={isUpcomingMeetingsOpen} onOpenChange={setIsUpcomingMeetingsOpen} className='space-y-2'>
              <CollapsibleTrigger className='flex w-full items-center justify-between rounded-md p-1 hover:bg-accent'>
                <p className='font-medium text-muted-foreground text-sm'>{t('upcoming_meetings')}</p>
                <motion.div animate={{ rotate: isUpcomingMeetingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className='size-4 text-muted-foreground' />
                </motion.div>
              </CollapsibleTrigger>
              <AnimatePresence initial={false}>
                {isUpcomingMeetingsOpen && (
                  <CollapsibleContent asChild forceMount>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className='space-y-2 pt-2'
                    >
                      {appointments.filter((apt) => new Date(apt.startAt) > new Date()).length === 0 ? (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className='px-1 text-muted-foreground text-xs'
                        >
                          {t('no_upcoming_meetings')}
                        </motion.p>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className='space-y-2'>
                          {appointments
                            .filter((apt) => new Date(apt.startAt) > new Date())
                            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                            .map((apt, index) => (
                              <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className='flex items-center gap-3 rounded-md border bg-card px-3 py-2'
                              >
                                <Calendar className='size-4 shrink-0 text-primary' />
                                <div className='min-w-0 flex-1'>
                                  <p className='truncate font-medium text-foreground text-sm'>{apt.title}</p>
                                  <p className='text-muted-foreground text-xs'>{formatDate(new Date(apt.startAt))}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type='button' className='shrink-0 text-muted-foreground hover:text-foreground'>
                                      <MoreHorizontal className='size-4' />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end' className='bg-popover text-popover-foreground'>
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
                                      <Edit2 className='mr-2 size-4' />
                                      {t('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='text-destructive' onClick={() => onDeleteAppointment(apt.id)}>
                                      <Trash2 className='mr-2 size-4' />
                                      {t('delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            ))}
                        </motion.div>
                      )}
                    </motion.div>
                  </CollapsibleContent>
                )}
              </AnimatePresence>
            </Collapsible>

            <Collapsible open={isPastMeetingsOpen} onOpenChange={setIsPastMeetingsOpen} className='space-y-2'>
              <CollapsibleTrigger className='flex w-full items-center justify-between rounded-md p-1 hover:bg-accent'>
                <p className='font-medium text-muted-foreground text-sm'>{t('past_meetings')}</p>
                <motion.div animate={{ rotate: isPastMeetingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className='size-4 text-muted-foreground' />
                </motion.div>
              </CollapsibleTrigger>
              <AnimatePresence initial={false}>
                {isPastMeetingsOpen && (
                  <CollapsibleContent asChild forceMount>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className='space-y-2 pt-2'
                    >
                      {appointments.filter((apt) => new Date(apt.startAt) <= new Date()).length === 0 ? (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className='text-muted-foreground text-xs'
                        >
                          {t('no_past_meetings')}
                        </motion.p>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className='space-y-2'>
                          {appointments
                            .filter((apt) => new Date(apt.startAt) <= new Date())
                            .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
                            .map((apt, index) => (
                              <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className='flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2'
                              >
                                <Calendar className='size-4 shrink-0 text-muted-foreground' />
                                <div className='min-w-0 flex-1'>
                                  <p className='truncate font-medium text-muted-foreground text-sm'>{apt.title}</p>
                                  <p className='text-muted-foreground text-xs'>{formatDate(new Date(apt.startAt))}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type='button' className='shrink-0 text-muted-foreground hover:text-foreground'>
                                      <MoreHorizontal className='size-4' />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end' className='bg-popover text-popover-foreground'>
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
                                      <Edit2 className='mr-2 size-4' />
                                      {t('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='text-destructive' onClick={() => onDeleteAppointment(apt.id)}>
                                      <Trash2 className='mr-2 size-4' />
                                      {t('delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            ))}
                        </motion.div>
                      )}
                    </motion.div>
                  </CollapsibleContent>
                )}
              </AnimatePresence>
            </Collapsible>
          </div>
        )}
      </div>

      <EventDialog
        open={!!editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        onSubmit={handleEditAppointment}
        isEditMode={true}
        key={editingAppointment?.id}
        defaultValues={
          editingAppointment
            ? {
                title: editingAppointment.title,
                description: editingAppointment.description,
                startAt: new Date(editingAppointment.startAt),
                endAt: new Date(editingAppointment.startAt.getTime() + 30 * 60000),
              }
            : undefined
        }
        folders={calendarFolders}
      />

      <EventDialog
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        onSubmit={onCreateAppointment}
        defaultValues={{
          title: defaultTitle || '',
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 60000),
          folderId: 'default',
        }}
        folders={calendarFolders}
      />
    </div>
  );
}
