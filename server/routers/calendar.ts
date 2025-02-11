import { appointmentSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const calendarRouter = createTRPCRouter({
  getMyFolders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.portal_calendarFolder.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),

  getAllFolders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.portal_calendarFolder.findMany({
      where: {
        OR: [{ visibility: 'PUBLIC' }, { userId: ctx.session.user.id }, { visibility: 'SHARED' }],
      },
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
      const existing = await ctx.db.portal_calendarFolder.findFirst({
        where: {
          userId: ctx.session.user.id,
          name: input.name,
        },
      });

      if (existing) {
        return existing;
      }

      return ctx.db.portal_calendarFolder.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          color: input.color,
          isDefault: input.isDefault,
          visibility: input.visibility,
        },
      });
    }),

  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.portal_calendarEvent.findMany({
        where: {
          OR: [
            { userId: ctx.session.user.id },
            {
              portal_calendarFolder: {
                OR: [{ visibility: 'SHARED' }, { visibility: 'PUBLIC' }],
              },
            },
          ],
          AND: [{ startAt: { gte: input.startDate } }, { endAt: { lte: input.endDate } }],
        },
        include: {
          portal_calendarFolder: true,
          portal_calendarEventParticipant: true,
        },
        orderBy: {
          startAt: 'desc',
        },
      });

      return events.map((event) => ({
        ...event,
        participants: event.portal_calendarEventParticipant,
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
      const event = await ctx.db.portal_calendarEvent.create({
        data: {
          userId: ctx.session.user.id,
          ...input,
          portal_calendarEventParticipant: {
            create: input.participants.map((p) => ({
              participantType: p.type,
              participantId: p.id,
              email: p.email,
              name: p.name,
              role: p.role,
              status: 'pending',
            })),
          },
        },
      });

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
      const participant = await ctx.db.portal_calendarEventParticipant.findFirst({
        where: {
          eventId: input.id,
          participantType: 'contact',
        },
        select: {
          participantId: true,
        },
      });

      const result = await ctx.db.portal_calendarEvent.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt,
        },
      });

      if (participant?.participantId) {
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
    const eventWithFolder = await ctx.db.portal_calendarEvent.findUnique({
      where: { id: input.id },
      include: {
        portal_calendarFolder: true,
      },
    });

    if (!eventWithFolder) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
    }

    const { portal_calendarFolder: folder, ...event } = eventWithFolder;

    if (folder?.visibility === 'PRIVATE' && event.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to delete this event' });
    }

    const participant = await ctx.db.portal_calendarEventParticipant.findFirst({
      where: {
        eventId: input.id,
        participantType: 'contact',
      },
      select: {
        participantId: true,
      },
    });

    if (participant?.participantId) {
      await createContactActivityHelper(ctx, {
        contactId: participant.participantId,
        type: 'ENGAGEMENT',
        subType: 'MEETING_CANCELLED',
        description: `Meeting "${event.title}" scheduled for ${new Date(event.startAt).toLocaleString()} was cancelled.`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          eventId: event.id,
          title: event.title,
          startAt: event.startAt,
        },
      });
    }

    return ctx.db.portal_calendarEvent.delete({
      where: { id: input.id },
    });
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
      return ctx.db.portal_calendarFolder.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          name: input.name,
          color: input.color,
          visibility: input.visibility,
        },
      });
    }),

  deleteFolder: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const folder = await ctx.db.portal_calendarFolder.findUnique({
      where: { id: input.id },
    });

    if (!folder) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Calendar folder not found' });
    }

    if (folder.userId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to delete this folder' });
    }

    if (folder.isDefault) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot delete the default folder' });
    }

    await ctx.db.portal_calendarEvent.deleteMany({
      where: { folderId: input.id },
    });

    return ctx.db.portal_calendarFolder.delete({
      where: { id: input.id },
    });
  }),

  getParticipantOptions: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.portal_user.findMany();
    const contacts = await ctx.db.portal_contact.findMany();

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

    const contactRecord = await ctx.db.portal_contact.findUnique({
      where: { id: contactId },
      select: { status: true },
    });

    const [event] = await ctx.db.$transaction([
      ctx.db.portal_calendarEvent.create({
        data: {
          userId: ctx.session.user.id,
          title,
          description,
          startAt,
          endAt,
          isAllDay: false,
          isPublic: false,
          folderId:
            (
              await ctx.db.portal_calendarFolder.findFirst({
                where: { userId: ctx.session.user.id },
              })
            )?.id ?? '',
          portal_calendarEventParticipant: {
            create: {
              participantType: 'contact',
              participantId: contactId,
              status: 'accepted',
              role: 'required',
            },
          },
        },
      }),

      contactRecord?.status === 'lead'
        ? ctx.db.portal_contact.update({
            where: { id: contactId },
            data: { status: 'appointment' },
          })
        : null,
    ]);

    await createContactActivityHelper(ctx, {
      contactId,
      type: 'ENGAGEMENT',
      subType: 'MEETING_SCHEDULED',
      description: `Meeting "${title}" scheduled for ${new Date(startAt).toLocaleString()}${description ? ` - ${description}` : ''}`,
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
      metadata: {
        eventId: event.id,
        startAt,
        endAt,
        description,
      },
    });

    return event;
  }),

  getAppointmentsByContactId: protectedProcedure.input(z.object({ contactId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.portal_calendarEvent.findMany({
      where: {
        portal_calendarEventParticipant: {
          some: {
            participantId: input.contactId,
            participantType: 'contact',
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
      },
      orderBy: {
        startAt: 'desc',
      },
    });
  }),
});
