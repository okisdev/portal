import CalendarEvent from '@/database/models/CalendarEvent';
import CalendarEventParticipant from '@/database/models/CalendarEventParticipant';
import CalendarFolder from '@/database/models/CalendarFolder';
import Contact from '@/database/models/Contact';
import User from '@/database/models/User';
import { appointmentSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const calendarRouter = createTRPCRouter({
  getMyFolders: protectedProcedure.query(async ({ ctx }) => {
    return await CalendarFolder.find({ userId: ctx.session.user.id });
  }),

  getAllFolders: protectedProcedure.query(async ({ ctx }) => {
    return await CalendarFolder.find({
      $or: [{ visibility: 'PUBLIC' }, { userId: ctx.session.user.id }, { visibility: 'SHARED' }],
    });
  }),

  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required'),
        color: z
          .string()
          .regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color')
          .default('#4f46e5'),
        isDefault: z.boolean().optional(),
        visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']).default('PRIVATE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await CalendarFolder.findOne({
        userId: ctx.session.user.id,
        name: input.name,
      });

      if (existing) {
        return existing;
      }

      // Create new folder
      const folder = await CalendarFolder.create({
        userId: ctx.session.user.id,
        name: input.name,
        color: input.color,
        isDefault: input.isDefault,
        visibility: input.visibility,
      });

      return folder;
    }),

  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const events = await CalendarEvent.aggregate([
        {
          $lookup: {
            from: 'calendarfolders',
            localField: 'folderId',
            foreignField: '_id',
            as: 'folder',
          },
        },
        {
          $match: {
            $or: [{ userId: ctx.session.user.id }, { 'folder.visibility': 'SHARED' }, { 'folder.visibility': 'PUBLIC' }],
            startAt: { $gte: input.startDate },
            endAt: { $lte: input.endDate },
          },
        },
        { $sort: { startAt: -1 } },
      ]);

      const participants = await CalendarEventParticipant.find({
        eventId: { $in: events.map((e) => e._id) },
      });

      return events.map((event) => ({
        ...event,
        participants: participants.filter((p) => p.eventId.toString() === event._id.toString()),
      }));
    }),

  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date(),
        endAt: z.date(),
        isAllDay: z.boolean(),
        isPublic: z.boolean(),
        folderId: z.string(),
        recurrence: z.string().optional(),
        metadata: z.string().optional(),
        participants: z
          .array(
            z.object({
              type: z.enum(['user', 'contact', 'external']),
              id: z.string().optional(),
              email: z.string().optional(),
              name: z.string().optional(),
              role: z.enum(['organizer', 'required', 'optional']),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [event] = await CalendarEvent.create({
        userId: ctx.session.user.id,
        ...input,
      });

      if (input.participants.length > 0) {
        const participants = input.participants.map((p) => ({
          participantType: p.type,
          participantId: p.id,
          email: p.email,
          name: p.name,
          role: p.role,
          eventId: event._id,
          status: 'pending' as const,
        }));

        await CalendarEventParticipant.create(participants);
      }

      return event;
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        startAt: z.date(),
        endAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get contact participant
      const participant = await CalendarEventParticipant.findOne({
        eventId: input.id,
        participantType: 'contact',
      });

      const result = await CalendarEvent.findByIdAndUpdate(
        input.id,
        {
          title: input.title,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt,
        },
        { new: true }
      );

      if (participant?.participantId) {
        // Log meeting update activity
        await createContactActivityHelper(ctx, {
          contactId: participant.participantId,
          type: 'ENGAGEMENT',
          subType: 'MEETING_UPDATED',
          description: `Meeting "${input.title}" was updated to ${new Date(input.startAt).toLocaleString()}${input.description ? ` - ${input.description}` : ''}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            eventId: input.id,
            title: input.title,
            startAt: input.startAt,
            endAt: input.endAt,
            description: input.description,
          },
        });
      }

      return result;
    }),

  deleteEvent: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const eventWithFolder = await CalendarEvent.findById(input.id).populate('folder');

    if (!eventWithFolder) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
    }

    // Check permissions
    if (eventWithFolder.folder?.visibility === 'PRIVATE' && eventWithFolder.userId.toString() !== ctx.session.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this event',
      });
    }

    const participant = await CalendarEventParticipant.findOne({
      eventId: input.id,
      participantType: 'contact',
    });

    if (participant) {
      await createContactActivityHelper(ctx, {
        contactId: participant.participantId,
        type: 'ENGAGEMENT',
        subType: 'MEETING_CANCELLED',
        description: `Meeting "${eventWithFolder.title}" scheduled for ${new Date(eventWithFolder.startAt).toLocaleString()} was cancelled.`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          eventId: eventWithFolder._id,
          title: eventWithFolder.title,
          startAt: eventWithFolder.startAt,
        },
      });
    }

    return await CalendarEvent.findByIdAndDelete(input.id);
  }),

  updateFolder: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await CalendarFolder.findByIdAndUpdate(
        input.id,
        {
          name: input.name,
          color: input.color,
          visibility: input.visibility,
        },
        { new: true }
      );
    }),

  deleteFolder: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Get folder details first
    const folder = await CalendarFolder.findById(input.id);

    if (!folder) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar folder not found' });
    }

    // Check if user has permission to delete the folder
    if (folder.userId.toString() !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to delete this folder' });
    }

    if (folder.isDefault) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot delete the default folder' });
    }

    // Delete all events in this folder first
    await CalendarEvent.deleteMany({ folderId: input.id });

    // Finally delete the folder
    return await CalendarFolder.findByIdAndDelete(input.id);
  }),

  getParticipantOptions: protectedProcedure.query(async ({ ctx }) => {
    const users = await User.find();
    const contacts = await Contact.find();

    return {
      users: users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim() || u.email || u.username,
      })),
      contacts: contacts.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
      })),
    };
  }),

  createAppointment: protectedProcedure.input(appointmentSchema).mutation(async ({ ctx, input }) => {
    const { title, description, startAt, endAt, contactId } = input;

    const contactStatus = await Contact.findById(contactId);

    // Create the calendar event
    const [event] = await CalendarEvent.create({
      userId: ctx.session.user.id,
      title,
      description,
      startAt,
      endAt,
      isAllDay: false,
      isPublic: false,
      folderId: (await CalendarFolder.findOne({ userId: ctx.session.user.id }))?.id ?? '',
    });

    if (contactStatus?.status === 'lead') {
      await Contact.findByIdAndUpdate(contactId, { status: 'appointment' });
    }

    // Add the contact as a participant
    await CalendarEventParticipant.create({
      eventId: event._id,
      participantType: 'contact',
      participantId: contactId,
      status: 'accepted',
      role: 'required',
    });

    // Log meeting creation activity
    await createContactActivityHelper(ctx, {
      contactId,
      type: 'ENGAGEMENT',
      subType: 'MEETING_SCHEDULED',
      description: `Meeting "${title}" scheduled for ${new Date(startAt).toLocaleString()}${description ? ` - ${description}` : ''}`,
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
      metadata: {
        eventId: event._id,
        startAt,
        endAt,
        description,
      },
    });

    return event;
  }),

  getAppointmentsByContactId: protectedProcedure.input(z.object({ contactId: z.string() })).query(async ({ ctx, input }) => {
    return await CalendarEvent.find({
      participantId: input.contactId,
      participantType: 'contact',
    }).sort({ startAt: -1 });
  }),
});
