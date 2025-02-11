import { activitySubTypeSchema, activityTypeSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const teamRouter = createTRPCRouter({
  getAllTeams: protectedProcedure.query(async ({ ctx }) => {
    const teams = await ctx.db.portal_team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        createdBy: true,
        portal_company: {
          select: {
            id: true,
            name: true,
          },
        },
        portal_teamContact: {
          select: {
            id: true,
          },
        },
      },
    });

    return teams.map((team) => ({
      ...team,
      contacts: team.portal_teamContact.length,
      company: team.portal_company,
    }));
  }),

  getContactTeams: protectedProcedure.input(z.object({ contactId: z.string() })).query(({ ctx, input }) => {
    return ctx.db.portal_team.findMany({
      where: {
        portal_teamContact: {
          some: {
            contactId: input.contactId,
          },
        },
      },
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
      const newTeam = await ctx.db.portal_team.create({
        data: {
          name: input.name,
          description: input.description,
          createdBy: ctx.session.user.id,
          companyId: input.companyId,
        },
      });

      await ctx.db.portal_teamActivity.create({
        data: {
          teamId: newTeam.id,
          type: 'TEAM',
          subType: 'TEAM_CREATED',
          description: `Team "${newTeam.name}" was created`,
          initiatorType: 'user',
          initiatorId: ctx.session.user.id,
          metadata: JSON.stringify({ team: newTeam }),
        },
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
      const existing = await ctx.db.portal_teamContact.findFirst({
        where: {
          teamId: input.teamId,
          contactId: input.contactId,
        },
      });

      if (existing) return existing;

      // Get team details for activity log
      const teamDetails = await ctx.db.portal_team.findUnique({
        where: { id: input.teamId },
        select: { name: true },
      });

      const result = await ctx.db.portal_teamContact.create({
        data: {
          teamId: input.teamId,
          contactId: input.contactId,
        },
      });

      // Log team assignment activity
      await ctx.db.portal_contactActivity.create({
        data: {
          contactId: input.contactId,
          type: 'TEAM',
          subType: 'TEAM_ASSIGNED',
          description: `Contact was assigned to team "${teamDetails?.name}"`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: input.teamId,
            teamName: teamDetails?.name,
          }),
        },
      });

      await ctx.db.portal_teamActivity.create({
        data: {
          teamId: input.teamId,
          type: 'TEAM',
          subType: 'TEAM_ASSIGNED',
          description: `Contact was assigned to team "${teamDetails?.name}"`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: input.teamId,
            teamName: teamDetails?.name,
          }),
        },
      });

      return result;
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
      const teamDetails = await ctx.db.portal_team.findUnique({
        where: { id: input.teamId },
        select: { name: true },
      });

      const result = await ctx.db.portal_teamContact.delete({
        where: {
          teamId_contactId: {
            teamId: input.teamId,
            contactId: input.contactId,
          },
        },
      });

      // Log team removal activity
      await ctx.db.portal_contactActivity.create({
        data: {
          contactId: input.contactId,
          type: 'TEAM',
          subType: 'TEAM_REMOVED',
          description: `Contact was removed from team "${teamDetails?.name}"`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: input.teamId,
            teamName: teamDetails?.name,
          }),
        },
      });

      await ctx.db.portal_teamActivity.create({
        data: {
          teamId: input.teamId,
          type: 'TEAM',
          subType: 'TEAM_REMOVED',
          description: `Contact was removed from team "${teamDetails?.name}"`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: input.teamId,
            teamName: teamDetails?.name,
          }),
        },
      });

      return result;
    }),

  getTeamById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.portal_team.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        leaderId: true,
        subLeaderId: true,
        referralId: true,
        campaignCode: true,
        remarks: true,
        companyId: true,
        portal_company: {
          select: {
            id: true,
            name: true,
          },
        },
        portal_leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        portal_subLeader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        portal_referral: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
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
        const campaign = await ctx.db.portal_marketingCampaign.findFirst({
          where: {
            campaignCode: input.campaignCode,
          },
        });

        if (!campaign) {
          campaignCodeToSet = undefined;
        }
      }

      if (input.company?.id) {
        // Verify company exists
        const companyRecord = await ctx.db.portal_company.findUnique({
          where: { id: input.company.id },
        });

        if (!companyRecord) {
          companyIdToSet = undefined;
        }
      } else {
        // If companyId is explicitly set to undefined in the input, we want to remove the company association
        companyIdToSet = null;
      }

      await ctx.db.portal_team.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.leaderId && { leaderId: input.leaderId }),
          ...(input.subLeaderId && { subLeaderId: input.subLeaderId }),
          ...(input.referralId && { referralId: input.referralId }),
          ...(campaignCodeToSet !== undefined && { campaignCode: campaignCodeToSet }),
          ...(companyIdToSet !== undefined && { companyId: companyIdToSet }),
          ...(input.remarks && { remarks: input.remarks }),
        },
      });

      await ctx.db.portal_teamActivity.create({
        data: {
          teamId: input.id,
          type: 'TEAM',
          subType: 'TEAM_UPDATED',
          description: `Team "${input.name}" was updated`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: input.id,
            teamName: input.name,
          }),
        },
      });
    }),

  updateTeamRemarks: protectedProcedure.input(z.object({ id: z.string(), remarks: z.string() })).mutation(async ({ ctx, input }) => {
    const teamDetails = await ctx.db.portal_team.findUnique({
      where: { id: input.id },
      select: { name: true },
    });

    await ctx.db.portal_team.update({
      where: { id: input.id },
      data: { remarks: input.remarks },
    });

    await ctx.db.portal_teamActivity.create({
      data: {
        teamId: input.id,
        type: 'TEAM',
        subType: 'TEAM_UPDATED',
        description: `Team "${teamDetails?.name}" was updated`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: JSON.stringify({
          teamId: input.id,
          teamName: teamDetails?.name,
        }),
      },
    });
  }),

  getTeamActivities: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.portal_teamActivity.findMany({
      where: { teamId: input.id },
      orderBy: { createdAt: 'asc' },
    });
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
      await ctx.db.portal_teamActivity.create({
        data: {
          teamId: input.teamId,
          userId: ctx.session?.user.id,
          type: input.type,
          subType: input.subType,
          initiatorType: input.initiatorType,
          initiatorId: input.initiatorId,
          description: input.description,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        },
      });

      const mentionRegex = /@(\w+)/g;
      const mentions = input.description.match(mentionRegex)?.map((m) => m.slice(1)) || [];

      if (mentions.length > 0) {
        // Get all mentioned users
        const mentionedUsers = await ctx.db.portal_user.findMany({
          where: {
            username: {
              in: mentions,
            },
          },
        });

        // Create notifications for mentioned users
        for (const mentionedUser of mentionedUsers) {
          await ctx.db.portal_userNotifications.create({
            data: {
              userId: mentionedUser.id,
              type: 'message',
              title: `${ctx.session?.user.name || 'Someone'} mentioned you in a note`,
              message: input.description,
              metadata: JSON.stringify({
                type: 'team',
                id: input.teamId,
              }),
            },
          });
        }
      }
    }),

  getTeamMeetings: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    const meetings = await ctx.db.portal_teamMeeting.findMany({
      where: { teamId: input.teamId },
      select: {
        id: true,
        title: true,
        description: true,
        meetingDate: true,
        status: true,
        createdAt: true,
        createdBy: true,
        portal_creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { meetingDate: 'asc' },
    });

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
      return await ctx.db.$transaction(async (tx) => {
        // Set initial status based on meeting date
        const status = input.meetingDate < new Date() ? 'completed' : 'upcoming';

        const teamDetails = await tx.portal_team.findUnique({
          where: { id: input.teamId },
        });

        const newMeeting = await tx.portal_teamMeeting.create({
          data: {
            teamId: input.teamId,
            title: input.title,
            description: input.description,
            meetingDate: input.meetingDate,
            status: status,
            createdBy: ctx.session.user.id,
          },
        });

        const defaultFolder = await tx.portal_calendarFolder.findFirst({
          where: { userId: ctx.session.user.id },
        });

        const calendarEvt = await tx.portal_calendarEvent.create({
          data: {
            userId: ctx.session.user.id,
            title: input.title,
            description: input.description,
            startAt: input.meetingDate,
            endAt: new Date(input.meetingDate.getTime() + 60 * 60 * 1000),
            isAllDay: false,
            isPublic: true,
            folderId: defaultFolder?.id ?? '',
            metadata: JSON.stringify({ teamMeetingId: newMeeting.id }),
          },
        });

        const teamMembers = await tx.portal_teamContact.findMany({
          where: { teamId: input.teamId },
          select: { contactId: true },
        });

        if (teamMembers.length > 0) {
          await tx.portal_calendarEventParticipant.createMany({
            data: teamMembers.map((member) => ({
              eventId: calendarEvt.id,
              participantType: 'contact',
              participantId: member.contactId,
              status: 'pending',
              role: 'required',
            })),
          });
        }

        await tx.portal_teamActivity.create({
          data: {
            teamId: input.teamId,
            type: 'TEAM',
            subType: 'MEETING_SCHEDULED',
            description: `Team meeting "${input.title}" was scheduled`,
            initiatorType: 'user',
            initiatorId: ctx.session?.user.id,
            metadata: JSON.stringify({
              teamId: input.teamId,
              teamName: teamDetails?.name,
            }),
          },
        });

        return newMeeting;
      });
    }),

  getTeamContacts: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.portal_teamContact.findMany({
      where: { teamId: input.teamId },
      select: {
        id: true,
        portal_contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            status: true,
          },
        },
      },
    });
  }),

  deleteTeamMeeting: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        await tx.portal_calendarEvent.deleteMany({
          where: {
            metadata: JSON.stringify({ teamMeetingId: input.id }),
          },
        });

        const deletedMeeting = await tx.portal_teamMeeting.delete({
          where: {
            id: input.id,
            teamId: input.teamId,
          },
        });

        const teamDetails = await tx.portal_team.findUnique({
          where: { id: input.teamId },
        });

        await tx.portal_teamActivity.create({
          data: {
            teamId: input.teamId,
            type: 'TEAM',
            subType: 'MEETING_CANCELLED',
            description: `Team meeting "${deletedMeeting.title}" was cancelled`,
            initiatorType: 'user',
            initiatorId: ctx.session?.user.id,
            metadata: JSON.stringify({
              teamId: input.teamId,
              teamName: teamDetails?.name,
            }),
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
      await ctx.db.portal_teamActivity.delete({
        where: { id: input.id },
      });
    }),

  addTeamContact: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingMember = await ctx.db.portal_teamContact.findFirst({
        where: {
          teamId: input.teamId,
          contactId: input.contactId,
        },
      });

      if (existingMember) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Contact is already a member of this team' });
      }

      // Get team details first
      const teamDetails = await ctx.db.portal_team.findUnique({
        where: { id: input.teamId },
        select: {
          id: true,
          name: true,
        },
      });

      const contactDetails = await ctx.db.portal_contact.findUnique({
        where: { id: input.contactId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!teamDetails) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      }

      await ctx.db.portal_contactActivity.create({
        data: {
          contactId: input.contactId,
          type: 'TEAM',
          subType: 'TEAM_ASSIGNED',
          description: `Contact was added to team: ${teamDetails.name}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: teamDetails.id,
            teamName: teamDetails.name,
          }),
        },
      });

      await ctx.db.portal_teamActivity.create({
        data: {
          teamId: input.teamId,
          type: 'TEAM',
          subType: 'TEAM_ASSIGNED',
          description: `Contact ${contactDetails?.firstName} ${contactDetails?.lastName} (${contactDetails?.email}) was added to team: ${teamDetails.name}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: JSON.stringify({
            teamId: teamDetails.id,
            teamName: teamDetails.name,
          }),
        },
      });

      const newMember = await ctx.db.portal_teamContact.create({
        data: {
          teamId: input.teamId,
          contactId: input.contactId,
        },
      });

      return newMember;
    }),

  deleteTeam: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.portal_team.delete({
      where: { id: input.id },
    });
  }),
});
