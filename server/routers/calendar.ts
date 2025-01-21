import { calendarEvent, calendarEventParticipant, calendarFolder, contact, contactActivity, user } from '@/drizzle/schema';
import { appointmentSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { z } from 'zod';

const activityTypeEnum = z.enum([
  // Contact Management
  'CONTACT_CREATED',
  'CONTACT_UPDATED',
  'CONTACT_DELETED',

  // Status Changes
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',

  // Engagement
  'MEETING_SCHEDULED',
  'MEETING_UPDATED',
  'MEETING_CANCELLED',
  'CALL_LOGGED',
  'EMAIL_SENT',
  'NOTE_ADDED',

  // Team Management
  'TEAM_ASSIGNED',
  'TEAM_REMOVED',

  // Deal Management
  'DEAL_CREATED',
  'DEAL_UPDATED',
  'DEAL_CLOSED',

  // Payment
  'PAYMENT_LINK_CLICKED',
  'PAYMENT_COMPLETED',
]);

// Helper function to create contact activity
const createContactActivityHelper = async (
  ctx: any,
  input: {
    contactId: string;
    type: z.infer<typeof activityTypeEnum>;
    title: string;
    description: string;
    initiatorType?: 'user' | 'contact' | 'system';
    initiatorId?: string;
    metadata?: Record<string, any>;
  }
) => {
  return ctx.db.insert(contactActivity).values({
    contactId: input.contactId,
    userId: ctx.session?.user.id,
    type: input.type,
    initiatorType: input.initiatorType || 'system',
    initiatorId: input.initiatorId || ctx.session?.user.id,
    title: input.title,
    description: input.description,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
};

export const calendarRouter = createTRPCRouter({
  getFolders: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(calendarFolder).where(eq(calendarFolder.userId, ctx.session.user.id));
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(calendarFolder)
        .where(and(eq(calendarFolder.userId, ctx.session.user.id), eq(calendarFolder.name, input.name)))
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
        .select()
        .from(calendarEvent)
        .where(and(eq(calendarEvent.userId, ctx.session.user.id), gte(calendarEvent.startAt, input.startDate), lte(calendarEvent.endAt, input.endDate)));

      const participants = await ctx.db
        .select()
        .from(calendarEventParticipant)
        .where(
          inArray(
            calendarEventParticipant.eventId,
            events.map((e) => e.id)
          )
        );

      return events.map((event) => ({
        ...event,
        participants: participants.filter((p) => p.eventId === event.id),
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
        .where(and(eq(calendarEventParticipant.eventId, input.id), eq(calendarEventParticipant.participantType, 'contact')))
        .then((rows) => rows[0]);

      const result = await ctx.db
        .update(calendarEvent)
        .set({
          title: input.title,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt,
        })
        .where(eq(calendarEvent.id, input.id))
        .returning();

      if (participant?.participantId) {
        // Log meeting update activity
        await createContactActivityHelper(ctx, {
          contactId: participant.participantId,
          type: 'MEETING_UPDATED',
          title: 'Meeting Updated',
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

      return result[0];
    }),

  deleteEvent: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    // Get event details before deletion
    const event = await ctx.db
      .select({
        id: calendarEvent.id,
        title: calendarEvent.title,
        startAt: calendarEvent.startAt,
      })
      .from(calendarEvent)
      .where(eq(calendarEvent.id, input))
      .then((rows) => rows[0]);

    // Get contact participant before deletion
    const participant = await ctx.db
      .select({
        participantId: calendarEventParticipant.participantId,
      })
      .from(calendarEventParticipant)
      .where(and(eq(calendarEventParticipant.eventId, input), eq(calendarEventParticipant.participantType, 'contact')))
      .then((rows) => rows[0]);

    if (participant?.participantId) {
      // Log meeting cancellation activity
      await createContactActivityHelper(ctx, {
        contactId: participant.participantId,
        type: 'MEETING_CANCELLED',
        title: 'Meeting Cancelled',
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

    return ctx.db.delete(calendarEvent).where(eq(calendarEvent.id, input));
  }),

  updateFolder: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(calendarFolder)
        .set({
          name: input.name,
          color: input.color,
        })
        .where(and(eq(calendarFolder.id, input.id), eq(calendarFolder.userId, ctx.session.user.id)));
    }),

  deleteFolder: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.db.delete(calendarFolder).where(and(eq(calendarFolder.id, input), eq(calendarFolder.userId, ctx.session.user.id)));
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

  createAppointment: protectedProcedure.input(appointmentSchema).mutation(async ({ ctx, input }) => {
    const { title, description, startAt, endAt, contactId } = input;

    const contactStatus = await ctx.db
      .select({ status: contact.status })
      .from(contact)
      .where(eq(contact.id, contactId))
      .then((rows) => rows[0]?.status);

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
        folderId:
          (
            await ctx.db
              .select()
              .from(calendarFolder)
              .where(eq(calendarFolder.userId, ctx.session.user.id))
              .limit(1)
              .then((rows) => rows[0])
          )?.id ?? '',
      })
      .returning();

    if (contactStatus === 'lead') {
      await ctx.db.update(contact).set({ status: 'appointment' }).where(eq(contact.id, contactId));
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
      type: 'MEETING_SCHEDULED',
      title: 'Meeting Scheduled',
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
        and(eq(calendarEventParticipant.eventId, calendarEvent.id), eq(calendarEventParticipant.participantId, input.contactId), eq(calendarEventParticipant.participantType, 'contact'))
      )
      .orderBy(desc(calendarEvent.startAt));
  }),
});
