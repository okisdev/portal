import { Company } from '@/database/models/company';
import { MarketingCampaign } from '@/database/models/marketingCampaign';
import { Team } from '@/database/models/team';
import { TeamActivity } from '@/database/models/teamActivity';
import { TeamContact } from '@/database/models/teamContact';
import { User } from '@/database/models/user';
import { UserNotifications } from '@/database/models/userNotifications';
import { activitySubTypeSchema, activityTypeSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTeamActivityHelper } from '@/server/helper/team';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const teamRouter = createTRPCRouter({
  getAllTeams: protectedProcedure.query(async ({ ctx }) => {
    return await Team.find().populate('contacts').populate('company');
  }),

  getContactTeams: protectedProcedure.input(z.object({ contactId: z.string() })).query(({ ctx, input }) => {
    return Team.find({
      contacts: { $in: [input.contactId] },
    });
  }),

  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        companyId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newTeam = await Team.create({
        name: input.name,
        description: input.description,
        createdBy: ctx.session.user.id,
        companyId: input.companyId,
      });

      await createTeamActivityHelper(ctx, {
        teamId: newTeam.id,
        type: 'TEAM',
        subType: 'TEAM_CREATED',
        description: `Team "${newTeam.name}" was created`,
        initiatorType: 'user',
        initiatorId: ctx.session.user.id,
        metadata: { team: newTeam },
      });
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
      const existing = await TeamContact.findOne({ teamId: input.teamId, contactId: input.contactId });

      if (existing) return existing;

      // Get team details for activity log
      const teamDetails = await Team.findById(input.teamId);

      const result = await TeamContact.create({
        teamId: input.teamId,
        contactId: input.contactId,
      });

      // Log team assignment activity
      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'TEAM',
        subType: 'TEAM_ASSIGNED',
        description: `Contact was assigned to team "${teamDetails.name}"`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          teamId: input.teamId,
          teamName: teamDetails.name,
        },
      });

      await createTeamActivityHelper(ctx, {
        teamId: input.teamId,
        type: 'TEAM',
        subType: 'TEAM_ASSIGNED',
        description: `Contact was assigned to team "${teamDetails.name}"`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
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
      const teamDetails = await Team.findById(input.teamId);

      const result = await TeamContact.deleteOne({ teamId: input.teamId, contactId: input.contactId });

      // Log team removal activity
      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'TEAM',
        subType: 'TEAM_REMOVED',
        description: `Contact was removed from team "${teamDetails.name}"`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          teamId: input.teamId,
          teamName: teamDetails.name,
        },
      });

      await createTeamActivityHelper(ctx, {
        teamId: input.teamId,
        type: 'TEAM',
        subType: 'TEAM_REMOVED',
        description: `Contact was removed from team "${teamDetails.name}"`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          teamId: input.teamId,
          teamName: teamDetails.name,
        },
      });

      return result;
    }),

  getTeamById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return Team.findById(input.id);
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
        campaignCode: z.string().optional(),
        remarks: z.string().optional(),
        company: z.object({ id: z.string(), name: z.string() }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let campaignCodeToSet: string | undefined = input.campaignCode;
      let companyIdToSet: string | null | undefined = input.company?.id;

      if (input.campaignCode) {
        // Verify campaign exists
        const campaign = await MarketingCampaign.findOne({ campaignCode: input.campaignCode });

        if (!campaign) {
          campaignCodeToSet = undefined;
        }
      }

      if (input.company?.id) {
        // Verify company exists
        const companyRecord = await Company.findById(input.company?.id);

        if (!companyRecord) {
          companyIdToSet = undefined;
        }
      } else {
        // If companyId is explicitly set to undefined in the input, we want to remove the company association
        companyIdToSet = null;
      }

      await Team.updateOne(
        { id: input.id },
        {
          $set: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            ...(input.leaderId && { leaderId: input.leaderId }),
            ...(input.subLeaderId && { subLeaderId: input.subLeaderId }),
            ...(input.referralId && { referralId: input.referralId }),
            ...(campaignCodeToSet !== undefined && { campaignCode: campaignCodeToSet }),
            ...(companyIdToSet !== undefined && { companyId: companyIdToSet }),
            ...(input.remarks && { remarks: input.remarks }),
          },
        }
      );

      await createTeamActivityHelper(ctx, {
        teamId: input.id,
        type: 'TEAM',
        subType: 'TEAM_UPDATED',
        description: `Team "${input.name}" was updated`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          teamId: input.id,
          teamName: input.name,
        },
      });
    }),

  updateTeamRemarks: protectedProcedure.input(z.object({ id: z.string(), remarks: z.string() })).mutation(async ({ ctx, input }) => {
    const teamDetails = await Team.findById(input.id);

    await Team.updateOne({ id: input.id }, { $set: { remarks: input.remarks } });

    await createTeamActivityHelper(ctx, {
      teamId: input.id,
      type: 'TEAM',
      subType: 'TEAM_UPDATED',
      description: `Team "${teamDetails.name}" was updated`,
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
      metadata: {
        teamId: input.id,
        teamName: teamDetails.name,
      },
    });
  }),

  getTeamActivities: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await TeamActivity.find({ teamId: input.id }).sort({ createdAt: -1 });
  }),

  createTeamActivity: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        type: activityTypeSchema,
        subType: activitySubTypeSchema,
        description: z.string(),
        initiatorType: z.enum(['user', 'system', 'team']).default('user'),
        initiatorId: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await TeamActivity.create({
        teamId: input.teamId,
        userId: ctx.session?.user.id,
        type: input.type,
        subType: input.subType,
        initiatorType: input.initiatorType,
        initiatorId: input.initiatorId,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });

      const mentionRegex = /@(\w+)/g;
      const mentions = input.description.match(mentionRegex)?.map((m) => m.slice(1)) || [];

      if (mentions.length > 0) {
        // Get all mentioned users
        const mentionedUsers = await User.find({ username: { $in: mentions } });

        // Create notifications for mentioned users
        for (const mentionedUser of mentionedUsers) {
          await UserNotifications.create({
            userId: mentionedUser.id,
            type: 'message',
            title: `${ctx.session?.user.name || 'Someone'} mentioned you in a note`,
            message: input.description,
            metadata: JSON.stringify({
              type: 'team',
              id: input.teamId,
            }),
          });
        }
      }
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
      return await TeamMeeting.transaction(async (tx) => {
        // Set initial status based on meeting date
        const status = input.meetingDate < new Date() ? 'completed' : 'upcoming';

        const teamDetails = await tx
          .select()
          .from(team)
          .where(eq(team.id, input.teamId))
          .then((rows) => rows[0]);

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

        await createTeamActivityHelper(ctx, {
          teamId: input.teamId,
          type: 'TEAM',
          subType: 'MEETING_SCHEDULED',
          description: `Team meeting "${input.title}" was scheduled`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            teamId: input.teamId,
            teamName: teamDetails.name,
          },
        });

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
      await ctx.db.transaction(async (tx) => {
        await tx.delete(calendarEvent).where(eq(calendarEvent.metadata, JSON.stringify({ teamMeetingId: input.id })));

        const [deletedMeeting] = await tx
          .delete(teamMeeting)
          .where(and(eq(teamMeeting.id, input.id), eq(teamMeeting.teamId, input.teamId)))
          .returning();

        const teamDetails = await tx
          .select()
          .from(team)
          .where(eq(team.id, input.teamId))
          .then((rows) => rows[0]);

        await createTeamActivityHelper(ctx, {
          teamId: input.teamId,
          type: 'TEAM',
          subType: 'MEETING_CANCELLED',
          description: `Team meeting "${deletedMeeting.title}" was cancelled`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            teamId: input.teamId,
            teamName: teamDetails.name,
          },
        });

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
      await ctx.db.delete(teamActivity).where(eq(teamActivity.id, input.id));
    }),

  addTeamContact: protectedProcedure
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
        throw new TRPCError({ code: 'CONFLICT', message: 'Contact is already a member of this team' });
      }

      // Get team details first
      const teamDetails = await ctx.db
        .select({
          id: team.id,
          name: team.name,
        })
        .from(team)
        .where(eq(team.id, input.teamId))
        .then((rows) => rows[0]);

      const contactDetails = await ctx.db
        .select({
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
        })
        .from(contact)
        .where(eq(contact.id, input.contactId))
        .then((rows) => rows[0]);

      if (!teamDetails) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'TEAM',
        subType: 'TEAM_ASSIGNED',
        description: `Contact was added to team: ${teamDetails.name}`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          teamId: teamDetails.id,
          teamName: teamDetails.name,
        },
      });

      await createTeamActivityHelper(ctx, {
        teamId: input.teamId,
        type: 'TEAM',
        subType: 'TEAM_ASSIGNED',
        description: `Contact ${contactDetails.firstName} ${contactDetails.lastName} (${contactDetails.email}) was added to team: ${teamDetails.name}`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: {
          teamId: teamDetails.id,
          teamName: teamDetails.name,
        },
      });

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
