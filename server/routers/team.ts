import { calendarEvent, calendarEventParticipant, calendarFolder, contact, contactActivity, team, teamActivity, teamContact, teamMeeting } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, eq, exists, sql } from 'drizzle-orm';
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
    metadata?: Record<string, any>;
  }
) => {
  return ctx.db.insert(contactActivity).values({
    contactId: input.contactId,
    userId: ctx.session?.user.id,
    type: input.type,
    initiatorType: input.initiatorType || 'system',
    initiatorId: ctx.session?.user.id,
    title: input.title,
    description: input.description,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
};

export const teamRouter = createTRPCRouter({
  getAllTeams: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: team.createdAt,
        createdBy: team.createdBy,
        contacts: sql<number>`(SELECT COUNT(*) FROM ${teamContact} WHERE ${teamContact.teamId} = ${team.id})`,
      })
      .from(team);
  }),

  getContactTeams: protectedProcedure.input(z.object({ contactId: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select()
      .from(team)
      .where(
        exists(
          ctx.db
            .select()
            .from(teamContact)
            .where(and(eq(teamContact.teamId, team.id), eq(teamContact.contactId, input.contactId)))
        )
      );
  }),

  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newTeam] = await ctx.db
        .insert(team)
        .values({
          name: input.name,
          description: input.description,
          createdBy: ctx.session.user.id,
        })
        .returning();

      return newTeam;
    }),

  assignContactToTeam: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already assigned
      const existing = await ctx.db
        .select()
        .from(teamContact)
        .where(and(eq(teamContact.teamId, input.teamId), eq(teamContact.contactId, input.contactId)))
        .then((rows) => rows[0]);

      if (existing) return existing;

      // Get team details for activity log
      const teamDetails = await ctx.db
        .select({
          name: team.name,
        })
        .from(team)
        .where(eq(team.id, input.teamId))
        .then((rows) => rows[0]);

      const result = await ctx.db
        .insert(teamContact)
        .values({
          teamId: input.teamId,
          contactId: input.contactId,
        })
        .returning();

      // Log team assignment activity
      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'TEAM_ASSIGNED',
        title: 'Assigned to Team',
        description: `Contact was assigned to team "${teamDetails.name}"`,
        metadata: {
          teamId: input.teamId,
          teamName: teamDetails.name,
        },
      });

      return result[0];
    }),

  removeContactFromTeam: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get team details for activity log
      const teamDetails = await ctx.db
        .select({
          name: team.name,
        })
        .from(team)
        .where(eq(team.id, input.teamId))
        .then((rows) => rows[0]);

      const result = await ctx.db
        .delete(teamContact)
        .where(and(eq(teamContact.teamId, input.teamId), eq(teamContact.contactId, input.contactId)))
        .returning();

      // Log team removal activity
      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'TEAM_REMOVED',
        title: 'Removed from Team',
        description: `Contact was removed from team "${teamDetails.name}"`,
        metadata: {
          teamId: input.teamId,
          teamName: teamDetails.name,
        },
      });

      return result[0];
    }),

  getTeamById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db
      .select({
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        createdBy: team.createdBy,
        leaderId: team.leaderId,
        subLeaderId: team.subLeaderId,
        referralId: team.referralId,
        campaignCode: team.campaignCode,
        remarks: team.remarks,
        leader: sql<{ id: string; firstName: string; lastName: string } | null>`
          (SELECT row_to_json(c) 
           FROM ${contact} c 
           WHERE c.id = ${team.leaderId})`,
        subLeader: sql<{ id: string; firstName: string; lastName: string } | null>`
          (SELECT row_to_json(c) 
           FROM ${contact} c 
           WHERE c.id = ${team.subLeaderId})`,
        referral: sql<{ id: string; firstName: string; lastName: string } | null>`
          (SELECT row_to_json(c) 
           FROM ${contact} c 
           WHERE c.id = ${team.referralId})`,
      })
      .from(team)
      .where(eq(team.id, input.id))
      .then((rows) => rows[0]);
  }),

  updateTeam: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        leaderId: z.string().optional(),
        subLeaderId: z.string().optional(),
        referralId: z.string().optional(),
        campaignCode: z
          .string()
          .optional()
          .transform((val) => val?.toUpperCase()),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(team)
        .set({
          name: input.name,
          description: input.description,
          leaderId: input.leaderId,
          subLeaderId: input.subLeaderId,
          referralId: input.referralId,
          campaignCode: input.campaignCode,
          remarks: input.remarks,
          updatedAt: new Date(),
        })
        .where(eq(team.id, input.id))
        .returning();

      return updated;
    }),

  updateTeamRemarks: protectedProcedure.input(z.object({ id: z.string(), remarks: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.update(team).set({ remarks: input.remarks }).where(eq(team.id, input.id));
  }),

  getTeamActivities: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        id: teamActivity.id,
        type: teamActivity.type,
        title: teamActivity.title,
        description: teamActivity.description,
        metadata: teamActivity.metadata,
        createdAt: teamActivity.createdAt,
        user: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
        },
      })
      .from(teamActivity)
      .leftJoin(contact, eq(teamActivity.userId, contact.id))
      .where(eq(teamActivity.teamId, input.teamId))
      .orderBy(teamActivity.createdAt);
  }),

  createTeamActivity: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        type: z.string(),
        title: z.string(),
        description: z.string().optional(),
        metadata: z.string().optional(),
        initiatorType: z.enum(['user', 'system']).default('user'),
        initiatorId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newActivity] = await ctx.db
        .insert(teamActivity)
        .values({
          teamId: input.teamId,
          userId: ctx.session.user.id,
          type: input.type,
          title: input.title,
          description: input.description,
          metadata: input.metadata,
          initiatorType: input.initiatorType,
          initiatorId: input.initiatorId,
        })
        .returning();

      return newActivity;
    }),

  getTeamMeetings: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    const meetings = await ctx.db
      .select({
        id: teamMeeting.id,
        title: teamMeeting.title,
        description: teamMeeting.description,
        meetingDate: teamMeeting.meetingDate,
        status: teamMeeting.status,
        createdAt: teamMeeting.createdAt,
        createdBy: teamMeeting.createdBy,
        creator: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
        },
      })
      .from(teamMeeting)
      .leftJoin(contact, eq(teamMeeting.createdBy, contact.id))
      .where(eq(teamMeeting.teamId, input.teamId))
      .orderBy(teamMeeting.meetingDate);

    return meetings.map((meeting) => ({
      ...meeting,
      status: meeting.meetingDate < new Date() ? 'completed' : meeting.status || 'upcoming',
    }));
  }),

  createTeamMeeting: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        meetingDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Set initial status based on meeting date
        const status = input.meetingDate < new Date() ? 'completed' : 'upcoming';

        const [newMeeting] = await tx
          .insert(teamMeeting)
          .values({
            teamId: input.teamId,
            title: input.title,
            description: input.description,
            meetingDate: input.meetingDate,
            status: status,
            createdBy: ctx.session.user.id,
          })
          .returning();

        const defaultFolder = await tx
          .select()
          .from(calendarFolder)
          .where(eq(calendarFolder.userId, ctx.session.user.id))
          .limit(1)
          .then((rows) => rows[0]);

        const [calendarEvt] = await tx
          .insert(calendarEvent)
          .values({
            userId: ctx.session.user.id,
            title: input.title,
            description: input.description,
            startAt: input.meetingDate,
            endAt: new Date(input.meetingDate.getTime() + 60 * 60 * 1000),
            isAllDay: false,
            isPublic: true,
            folderId: defaultFolder?.id ?? '',
            metadata: JSON.stringify({ teamMeetingId: newMeeting.id }),
          })
          .returning();

        const teamMembers = await tx
          .select({
            contactId: teamContact.contactId,
          })
          .from(teamContact)
          .where(eq(teamContact.teamId, input.teamId));

        if (teamMembers.length > 0) {
          await tx.insert(calendarEventParticipant).values(
            teamMembers.map((member) => ({
              eventId: calendarEvt.id,
              participantType: 'contact' as const,
              participantId: member.contactId,
              status: 'pending' as const,
              role: 'required' as const,
            }))
          );
        }

        return newMeeting;
      });
    }),

  getTeamContacts: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        id: teamContact.id,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          status: contact.status,
        },
      })
      .from(teamContact)
      .innerJoin(contact, eq(teamContact.contactId, contact.id))
      .where(eq(teamContact.teamId, input.teamId));
  }),

  deleteTeamMeeting: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        await tx.delete(calendarEvent).where(eq(calendarEvent.metadata, JSON.stringify({ teamMeetingId: input.id })));

        const [deletedMeeting] = await tx
          .delete(teamMeeting)
          .where(and(eq(teamMeeting.id, input.id), eq(teamMeeting.teamId, input.teamId)))
          .returning();

        return deletedMeeting;
      });
    }),

  deleteTeamActivity: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(teamActivity).where(eq(teamActivity.id, input.id));
    }),

  addTeamMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingMember = await ctx.db
        .select()
        .from(teamContact)
        .where(and(eq(teamContact.teamId, input.teamId), eq(teamContact.contactId, input.contactId)))
        .then((rows) => rows[0]);

      if (existingMember) {
        throw new Error('Contact is already a member of this team');
      }

      const [newMember] = await ctx.db
        .insert(teamContact)
        .values({
          teamId: input.teamId,
          contactId: input.contactId,
        })
        .returning();

      return newMember;
    }),

  deleteTeam: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.delete(team).where(eq(team.id, input.id));
  }),
});
