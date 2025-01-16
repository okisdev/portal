import { calendarEvent, calendarEventParticipant, calendarFolder, contact, user } from '@/drizzle/schema';
import { appointmentSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { z } from 'zod';

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
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date().optional(),
        endAt: z.date().optional(),
        isAllDay: z.boolean().optional(),
        isPublic: z.boolean().optional(),
        folderId: z.string().optional(),
        recurrence: z.string().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(calendarEvent)
        .set(updateData)
        .where(and(eq(calendarEvent.id, input.id), eq(calendarEvent.userId, ctx.session.user.id)));
    }),

  deleteEvent: protectedProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(calendarEvent).where(and(eq(calendarEvent.id, input), eq(calendarEvent.userId, ctx.session.user.id)));
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
    const { title, description, date, contactId } = input;

    // Create the calendar event
    const [event] = await ctx.db
      .insert(calendarEvent)
      .values({
        userId: ctx.session.user.id,
        title,
        description,
        startAt: date,
        endAt: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour duration
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

    // Add the contact as a participant
    await ctx.db.insert(calendarEventParticipant).values({
      eventId: event.id,
      participantType: 'contact',
      participantId: contactId,
      status: 'accepted',
      role: 'required',
    });

    return event;
  }),
});
