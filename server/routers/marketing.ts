import { ContactCampaign } from '@/database/models/contactCampaign';
import { MarketingCampaign } from '@/database/models/marketingCampaign';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const marketingRouter = createTRPCRouter({
  getAllCampaigns: protectedProcedure.query(({ ctx }) => {
    return MarketingCampaign.find();
  }),

  getCampaignById: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return MarketingCampaign.findOne({ id: input.id });
  }),

  getActiveCampaigns: protectedProcedure.query(({ ctx }) => {
    return MarketingCampaign.find({ status: 'active' }).sort({ createdAt: -1 });
  }),

  getCampaignByCode: protectedProcedure.input(z.object({ code: z.string() })).query(({ ctx, input }) => {
    return MarketingCampaign.findOne({ campaignCode: input.code });
  }),

  getCampaignContacts: protectedProcedure.input(z.object({ code: z.string().optional(), id: z.string().optional() })).query(({ ctx, input }) => {
    if (input.id) {
      return MarketingCampaign.findOne({ id: input.id }).then((campaign) => {
        return ContactCampaign.find({ campaignCode: campaign?.campaignCode }).then((contacts) => {
          return contacts.map((contact) => {
            return contact.contactId;
          });
        });
      });
    }

    if (input.code) {
      return MarketingCampaign.findOne({ campaignCode: input.code }).then((campaign) => {
        return ContactCampaign.find({ campaignCode: campaign?.campaignCode }).then((contacts) => {
          return contacts.map((contact) => {
            return contact.contactId;
          });
        });
      });
    }
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
    .mutation(({ ctx, input }) => {
      return MarketingCampaign.create({
        ...input,
        createdBy: ctx.session.user.id,
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
    .mutation(({ ctx, input }) => {
      const { code, ...updateData } = input;
      return MarketingCampaign.updateOne({ campaignCode: code }, { $set: { ...updateData, updatedBy: ctx.session.user.id } });
    }),

  deleteCampaign: protectedProcedure.input(z.object({ code: z.string() })).mutation(({ ctx, input }) => {
    return MarketingCampaign.deleteOne({ campaignCode: input.code });
  }),
});
