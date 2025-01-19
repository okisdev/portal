'use client';

import { Combobox } from '@/components/shared/combobox';
import { DateTimePicker } from '@/components/shared/date-time-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateUUID } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
  initialParticipants?: {
    type: 'user' | 'contact' | 'external';
    id?: string;
    email?: string;
    name?: string;
    role?: 'organizer' | 'required' | 'optional';
  }[];
  onCreateFolder?: (name: string) => Promise<void>;
}

export function EventDialog({ open, onOpenChange, onSubmit, isEditMode = false, defaultValues, folders = [], participantOptions, initialParticipants = [], onCreateFolder }: EventDialogProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startAt: new Date(),
      endAt: new Date(),
      isAllDay: false,
      isPublic: false,
      folderId: folders[0]?.id ?? '',
      participants: initialParticipants,
      ...defaultValues,
    },
  });

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
            folderId: folders[0]?.id ?? '',
            participants: initialParticipants,
            ...defaultValues,
          });
        }
      }}
    >
      <DialogContent className='max-h-[90vh] max-w-xl overflow-y-auto'>
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
                    <Combobox
                      value={field.value || ''}
                      onChange={field.onChange}
                      items={['Meeting Room 1', 'Meeting Room 2', 'Conference Room A', 'Conference Room B', 'Office', 'Virtual Meeting', 'Zoom', 'Google Meet', 'Microsoft Teams']}
                      placeholder='Enter or select location'
                      searchPlaceholder='Search locations...'
                      emptyText='No locations found'
                      groupHeading='Suggested Locations'
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
                      <DateTimePicker value={field.value} onChange={(date) => field.onChange(date)} showTimePicker={!form.watch('isAllDay')} />
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
                      <DateTimePicker value={field.value} onChange={(date) => field.onChange(date)} showTimePicker={!form.watch('isAllDay')} />
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

            {participantOptions && (
              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <p className='font-medium text-sm'>Participants</p>
                  <button
                    type='button'
                    onClick={() => {
                      const participants = form.getValues('participants');
                      form.setValue('participants', [...participants, { type: 'external', email: '', name: '', role: 'required' }]);
                    }}
                    className='flex items-center justify-center rounded-full bg-gray-100 p-1 transition-colors hover:bg-gray-200'
                  >
                    <PlusIcon className='size-4' />
                  </button>
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
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder='Select contact' />
                              </SelectTrigger>
                              <SelectContent>
                                {participantOptions.contacts?.map((contact) => (
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
            )}

            <div className='flex justify-end gap-2'>
              <Button type='submit'>{isEditMode ? 'Update' : 'Create'} Event</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
