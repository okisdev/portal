'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { Combobox } from '@/components/shared/combobox';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';

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

export type EventFormData = z.infer<typeof eventFormSchema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  isEditMode?: boolean;
  defaultValues?: Partial<EventFormData>;
  folders?: { id: string; name: string }[];
  participantOptions?: {
    users?: { id: string; name: string }[];
    contacts?: { id: string; name: string }[];
  };
  onCreateFolder?: (name: string) => Promise<void>;
}

export function EventDialog({
  open,
  onOpenChange,
  onSubmit,
  isEditMode = false,
  defaultValues,
  folders = [],
  participantOptions,
  onCreateFolder,
}: EventDialogProps) {
  const t = useTranslations();

  const setAllDayEventTimes = (date: Date, isEnd = false) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    if (isEnd) {
      // For end date, add one day to make it end at 00:00 of the next day
      newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
  };

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      location: defaultValues?.location || '',
      startAt: defaultValues?.startAt || new Date(),
      endAt: defaultValues?.endAt || new Date(),
      isAllDay: defaultValues?.isAllDay || false,
      isPublic: defaultValues?.isPublic || false,
      folderId: defaultValues?.folderId || folders[0]?.id || '',
      participants: defaultValues?.participants || [],
    },
  });

  useEffect(() => {
    if (open) {
      const startAt = defaultValues?.startAt || new Date();
      const endAt = defaultValues?.endAt || new Date();
      const isAllDay = defaultValues?.isAllDay || false;

      form.reset({
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        location: defaultValues?.location || '',
        startAt: isAllDay ? setAllDayEventTimes(startAt) : startAt,
        endAt: isAllDay ? setAllDayEventTimes(endAt, true) : endAt,
        isAllDay,
        isPublic: defaultValues?.isPublic || false,
        folderId: defaultValues?.folderId || folders[0]?.id || '',
        participants: defaultValues?.participants || [],
      });
    }
  }, [defaultValues, folders, form, open]);

  // Watch for changes to isAllDay and update times accordingly
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'isAllDay') {
        const isAllDay = value.isAllDay;
        const currentStart = form.getValues('startAt');
        const currentEnd = form.getValues('endAt');

        if (isAllDay) {
          form.setValue('startAt', setAllDayEventTimes(currentStart));
          form.setValue('endAt', setAllDayEventTimes(currentEnd, true));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Watch for changes to startAt and adjust endAt if needed
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'startAt') {
        const startAt = value.startAt as Date;
        const endAt = form.getValues('endAt') as Date;

        if (endAt < startAt) {
          const newEndAt = new Date(startAt);
          newEndAt.setMinutes(newEndAt.getMinutes() + 30);
          form.setValue('endAt', newEndAt);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleCalendarSelect = async (value: string) => {
    if (onCreateFolder && !folders?.some((folder) => folder.name === value)) {
      await onCreateFolder(value);
    }

    const folder = folders?.find((f) => f.name === value);
    if (folder) {
      form.setValue('folderId', folder.id);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          form.reset({
            title: '',
            description: '',
            location: '',
            startAt: new Date(),
            endAt: new Date(),
            isAllDay: false,
            isPublic: false,
            folderId: folders[0]?.id || '',
            participants: [],
          });
        }
      }}
    >
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('edit_event') : t('create_new_event')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              onSubmit(data);
              onOpenChange(false);
            })}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('title')}</FormLabel>
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
                  <FormLabel>{t('description')}</FormLabel>
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
                  <FormLabel>{t('location')}</FormLabel>
                  <FormControl>
                    <Combobox
                      value={field.value || ''}
                      onChange={field.onChange}
                      items={[
                        'Meeting Room 1',
                        'Meeting Room 2',
                        'Conference Room A',
                        'Conference Room B',
                        'Office',
                        'Virtual Meeting',
                        'Zoom',
                        'Google Meet',
                        'Microsoft Teams',
                      ]}
                      placeholder={t('enter_or_select_location')}
                      searchPlaceholder={t('search_locations')}
                      emptyText={t('no_locations_found')}
                      groupHeading={t('suggested_locations')}
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
                  <FormItem className='flex flex-row items-center justify-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='text-sm'>{t('all_day')}</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isPublic'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center gap-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='text-sm'>{t('public')}</FormLabel>
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
                    <FormLabel>{t('start')}</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        showTimePicker={!form.watch('isAllDay')}
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
                    <FormLabel>{t('end')}</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        showTimePicker={!form.watch('isAllDay')}
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
                  <FormLabel>{t('calendar')}</FormLabel>
                  <FormControl>
                    <Combobox
                      value={
                        folders?.find((f) => f.id === field.value)?.name || ''
                      }
                      onChange={handleCalendarSelect}
                      items={folders?.map((f) => f.name) || []}
                      placeholder={t('select_or_create_calendar')}
                      searchPlaceholder={t('search_calendars')}
                      emptyText={t('no_calendars_found')}
                      groupHeading={t('calendars')}
                      allowCustom={false}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {participantOptions && (
              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <p className='font-medium text-sm'>{t('participants')}</p>
                  <button
                    type='button'
                    onClick={() => {
                      const participants = form.getValues('participants') || [];
                      form.setValue('participants', [
                        ...participants,
                        {
                          type: 'external',
                          email: '',
                          name: '',
                          role: 'required',
                        },
                      ]);
                    }}
                    className='flex items-center justify-center rounded-full bg-neutral-100 p-1 transition-colors hover:bg-neutral-200'
                  >
                    <PlusIcon className='size-4' />
                  </button>
                </div>

                {(form.watch('participants') || []).map(
                  (participant, index) => (
                    <div
                      key={participant.id + nanoid()}
                      className='flex items-start gap-2'
                    >
                      <FormField
                        control={form.control}
                        name={`participants.${index}.type`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <Select
                              value={field.value}
                              onValueChange={(
                                value: 'user' | 'contact' | 'external'
                              ) => {
                                field.onChange(value);
                                form.setValue(
                                  `participants.${index}.id`,
                                  undefined
                                );
                                form.setValue(
                                  `participants.${index}.email`,
                                  undefined
                                );
                                form.setValue(
                                  `participants.${index}.name`,
                                  undefined
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('type')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='user'>
                                  {t('user')}
                                </SelectItem>
                                <SelectItem value='contact'>
                                  {t('contact')}
                                </SelectItem>
                                <SelectItem value='external'>
                                  {t('external')}
                                </SelectItem>
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
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('select_user')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {participantOptions.users?.map((user) => (
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
                              <Combobox
                                value={
                                  participantOptions.contacts?.find(
                                    (contact) => contact.id === field.value
                                  )?.name || ''
                                }
                                onChange={(value) => {
                                  const contact =
                                    participantOptions.contacts?.find(
                                      (c) => c.name === value
                                    );
                                  field.onChange(contact?.id || '');
                                }}
                                items={
                                  participantOptions.contacts?.map(
                                    (contact) => contact.name
                                  ) || []
                                }
                                placeholder={t('select_contact')}
                                searchPlaceholder={t('search_contacts')}
                                emptyText={t('no_contacts_found')}
                                groupHeading={t('contacts')}
                                allowCustom={false}
                              />
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
                                <Input {...field} placeholder={t('name')} />
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
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('role')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='organizer'>
                                  {t('organizer')}
                                </SelectItem>
                                <SelectItem value='required'>
                                  {t('required')}
                                </SelectItem>
                                <SelectItem value='optional'>
                                  {t('optional')}
                                </SelectItem>
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
                          const participants =
                            form.getValues('participants') || [];
                          form.setValue(
                            'participants',
                            participants.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}

            <div className='flex justify-end gap-2'>
              <Button type='submit'>
                {isEditMode ? t('update_event') : t('create_event')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
