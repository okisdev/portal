import { TRPCError } from '@trpc/server';
import { and, desc, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { z } from 'zod/v4';
import {
  calendarEvent,
  calendarEventParticipant,
  calendarFolder,
  contact,
  user,
} from '@/drizzle/schema';
import { appointmentSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const calendarRouter = createTRPCRouter({
  getMyFolders: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(calendarFolder)
      .where(eq(calendarFolder.userId, ctx.session.user.id));
  }),

  getAllFolders: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(calendarFolder)
      .where(
        or(
          eq(calendarFolder.visibility, 'PUBLIC'),
          eq(calendarFolder.userId, ctx.session.user.id),
          eq(calendarFolder.visibility, 'SHARED')
        )
      );
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
      const existing = await ctx.db
        .select()
        .from(calendarFolder)
        .where(
          and(
            eq(calendarFolder.userId, ctx.session.user.id),
            eq(calendarFolder.name, input.name)
          )
        )
        .then((rows) => rows[0]);

      if (existing) {
        return existing;
      }

      // Create new folder
      const [folder] = await ctx.db
        .insert(calendarFolder)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          color: input.color,
          isDefault: input.isDefault,
          visibility: input.visibility,
        })
        .returning();

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
      const events = await ctx.db
        .select({
          event: calendarEvent,
          folder: calendarFolder,
        })
        .from(calendarEvent)
        .leftJoin(calendarFolder, eq(calendarEvent.folderId, calendarFolder.id))
        .where(
          and(
            or(
              eq(calendarEvent.userId, ctx.session.user.id),
              eq(calendarFolder.visibility, 'SHARED'),
              eq(calendarFolder.visibility, 'PUBLIC')
            ),
            gte(calendarEvent.startAt, input.startDate),
            lte(calendarEvent.endAt, input.endDate)
          )
        )
        .orderBy(desc(calendarEvent.startAt));

      const participants = await ctx.db
        .select()
        .from(calendarEventParticipant)
        .where(
          inArray(
            calendarEventParticipant.eventId,
            events.map((e) => e.event.id)
          )
        );

      return events.map((row) => ({
        ...row.event,
        participants: participants.filter((p) => p.eventId === row.event.id),
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
      const [event] = await ctx.db
        .insert(calendarEvent)
        .values({
          userId: ctx.session.user.id,
          ...input,
        })
        .returning();

      if (input.participants.length > 0) {
        const participants = input.participants.map((p) => ({
          participantType: p.type,
          participantId: p.id,
          email: p.email,
          name: p.name,
          role: p.role,
          eventId: event.id,
          status: 'pending' as const,
        }));

        await ctx.db.insert(calendarEventParticipant).values(participants);
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
      const participant = await ctx.db
        .select({
          participantId: calendarEventParticipant.participantId,
        })
        .from(calendarEventParticipant)
        .where(
          and(
            eq(calendarEventParticipant.eventId, input.id),
            eq(calendarEventParticipant.participantType, 'contact')
          )
        )
        .then((rows) => rows[0]);

      const [result] = await ctx.db
        .update(calendarEvent)
        .set({
          title: input.title,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt,
        })
        .where(eq(calendarEvent.id, input.id))
        .returning();

      const thisContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.id, participant?.participantId ?? ''))
        .then((rows) => rows[0]);

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
            contact: thisContact,
            event: result,
            oldStartAt: input.startAt,
            newStartAt: input.startAt,
            oldEndAt: input.endAt,
            newEndAt: input.endAt,
            oldDescription: input.description,
            newDescription: input.description,
          },
        });
      }

      return result;
    }),

  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get event details and folder details before deletion
      const eventWithFolder = await ctx.db
        .select({
          event: calendarEvent,
          folder: calendarFolder,
        })
        .from(calendarEvent)
        .leftJoin(calendarFolder, eq(calendarEvent.folderId, calendarFolder.id))
        .where(eq(calendarEvent.id, input.id))
        .then((rows) => rows[0]);

      if (!eventWithFolder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      }

      const { event, folder } = eventWithFolder;

      // Check permissions:
      // 1. If event is in a private folder, only the creator can delete
      // 2. If event is in a shared/public folder, any user can delete
      if (
        folder?.visibility === 'PRIVATE' &&
        event.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this event',
        });
      }

      // Get contact participant before deletion
      const participant = await ctx.db
        .select({
          participantId: calendarEventParticipant.participantId,
        })
        .from(calendarEventParticipant)
        .where(
          and(
            eq(calendarEventParticipant.eventId, input.id),
            eq(calendarEventParticipant.participantType, 'contact')
          )
        )
        .then((rows) => rows[0]);

      const whichContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.id, participant?.participantId ?? ''))
        .then((rows) => rows[0]);

      if (participant?.participantId) {
        // Log meeting cancellation activity
        await createContactActivityHelper(ctx, {
          contactId: participant.participantId,
          type: 'ENGAGEMENT',
          subType: 'MEETING_CANCELLED',
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            contact: whichContact,
            event,
            startAt: event.startAt,
            endAt: event.endAt,
          },
        });
      }

      return ctx.db.delete(calendarEvent).where(eq(calendarEvent.id, input.id));
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
      return ctx.db
        .update(calendarFolder)
        .set({
          name: input.name,
          color: input.color,
          visibility: input.visibility,
        })
        .where(
          and(
            eq(calendarFolder.id, input.id),
            eq(calendarFolder.userId, ctx.session.user.id)
          )
        );
    }),

  deleteFolder: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get folder details first
      const folder = await ctx.db
        .select()
        .from(calendarFolder)
        .where(eq(calendarFolder.id, input.id))
        .then((rows) => rows[0]);

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calendar folder not found',
        });
      }

      // Check if user has permission to delete the folder
      if (folder.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this folder',
        });
      }

      if (folder.isDefault) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot delete the default folder',
        });
      }

      // Delete all events in this folder first
      await ctx.db
        .delete(calendarEvent)
        .where(eq(calendarEvent.folderId, input.id));

      // Finally delete the folder
      return ctx.db
        .delete(calendarFolder)
        .where(eq(calendarFolder.id, input.id));
    }),

  getParticipantOptions: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.select().from(user);
    const contacts = await ctx.db.select().from(contact);

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

  createAppointment: protectedProcedure
    .input(appointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const { title, description, startAt, endAt, contactId } = input;

      const thisContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.id, contactId))
        .then((rows) => rows[0]);

      // Get or create default calendar folder
      let folder = await ctx.db
        .select()
        .from(calendarFolder)
        .where(eq(calendarFolder.userId, ctx.session.user.id))
        .limit(1)
        .then((rows) => rows[0]);

      if (!folder) {
        [folder] = await ctx.db
          .insert(calendarFolder)
          .values({
            userId: ctx.session.user.id,
            name: 'My Calendar',
            color: '#4f46e5',
            isDefault: true,
            visibility: 'PRIVATE',
          })
          .returning();
      }

      // Create the calendar event
      const [event] = await ctx.db
        .insert(calendarEvent)
        .values({
          userId: ctx.session.user.id,
          title,
          description,
          startAt,
          endAt,
          isAllDay: false,
          isPublic: false,
          folderId: folder.id,
        })
        .returning();

      if (thisContact.status === 'Lead') {
        await ctx.db
          .update(contact)
          .set({ status: 'Appointment' })
          .where(eq(contact.id, contactId));
      }

      // Add the contact as a participant
      await ctx.db.insert(calendarEventParticipant).values({
        eventId: event.id,
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
        metadata: {
          contact: thisContact,
          event,
          startAt,
          endAt,
          description,
        },
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
      });

      return event;
    }),

  getAppointmentsByContactId: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          id: calendarEvent.id,
          title: calendarEvent.title,
          description: calendarEvent.description,
          startAt: calendarEvent.startAt,
          endAt: calendarEvent.endAt,
        })
        .from(calendarEvent)
        .innerJoin(
          calendarEventParticipant,
          and(
            eq(calendarEventParticipant.eventId, calendarEvent.id),
            eq(calendarEventParticipant.participantId, input.contactId),
            eq(calendarEventParticipant.participantType, 'contact')
          )
        )
        .orderBy(desc(calendarEvent.startAt));
    }),
});
