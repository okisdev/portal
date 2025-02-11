import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const marketingRouter = createTRPCRouter({
  getAllCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.portal_marketingCampaign.findMany({
      select: {
        id: true,
        name: true,
        campaignCode: true,
        description: true,
        type: true,
        status: true,
        metrics: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        portal_contactCampaign: {
          select: {
            _count: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns.map((campaign) => ({
      ...campaign,
      contactCount: campaign.portal_contactCampaign._count,
    }));
  }),

  getCampaignById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const campaign = await ctx.db.portal_marketingCampaign.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        campaignCode: true,
        description: true,
        type: true,
        status: true,
        metrics: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        portal_contactCampaign: {
          select: {
            _count: true,
          },
        },
      },
    });

    return campaign
      ? {
          ...campaign,
          contactCount: campaign.portal_contactCampaign._count,
        }
      : null;
  }),

  getActiveCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.portal_marketingCampaign.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        campaignCode: true,
        description: true,
        type: true,
        status: true,
        metrics: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        portal_contactCampaign: {
          select: {
            _count: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns.map((campaign) => ({
      ...campaign,
      contactCount: campaign.portal_contactCampaign._count,
    }));
  }),

  getCampaignByCode: protectedProcedure.input(z.object({ code: z.string() })).query(async ({ ctx, input }) => {
    const campaign = await ctx.db.portal_marketingCampaign.findUnique({
      where: { campaignCode: input.code },
      select: {
        id: true,
        name: true,
        campaignCode: true,
        description: true,
        type: true,
        status: true,
        metrics: true,
        createdAt: true,
        updatedAt: true,
        portal_contactCampaign: {
          select: {
            _count: true,
          },
        },
      },
    });

    return campaign
      ? {
          ...campaign,
          contactCount: campaign.portal_contactCampaign._count,
        }
      : null;
  }),

  getCampaignContacts: protectedProcedure.input(z.object({ code: z.string().optional(), id: z.string().optional() })).query(async ({ ctx, input }) => {
    if (input.id) {
      return ctx.db.portal_contact.findMany({
        where: {
          portal_contactCampaign: {
            some: {
              portal_marketingCampaign: {
                id: input.id,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          portal_contactCampaign: {
            select: {
              joinedAt: true,
            },
            where: {
              portal_marketingCampaign: {
                id: input.id,
              },
            },
          },
        },
      });
    }
    if (input.code) {
      return ctx.db.portal_contact.findMany({
        where: {
          portal_contactCampaign: {
            some: {
              campaignCode: input.code,
            },
          },
        },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          portal_contactCampaign: {
            select: {
              joinedAt: true,
            },
            where: {
              campaignCode: input.code,
            },
          },
        },
      });
    }

    return null;
  }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        campaignCode: z.string(),
        description: z.string().optional(),
        type: z.enum(['email', 'social', 'event', 'referral', 'other']),
        status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).optional(),
        metrics: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.portal_marketingCampaign.create({
        data: {
          ...input,
          createdBy: ctx.session.user.id,
        },
      });
    }),

  updateCampaign: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['email', 'social', 'event', 'referral', 'other']).optional(),
        status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).optional(),
        metrics: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { code, ...updateData } = input;
      return ctx.db.portal_marketingCampaign.update({
        where: { campaignCode: code },
        data: {
          ...updateData,
          updatedBy: ctx.session.user.id,
        },
      });
    }),

  deleteCampaign: protectedProcedure.input(z.object({ code: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.portal_marketingCampaign.delete({
      where: { campaignCode: input.code },
    });
  }),
});
