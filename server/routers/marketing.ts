import { contact, contactCampaign, marketingCampaign } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export const marketingRouter = createTRPCRouter({
  getAllCampaigns: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        id: marketingCampaign.id,
        name: marketingCampaign.name,
        campaignCode: marketingCampaign.campaignCode,
        description: marketingCampaign.description,
        type: marketingCampaign.type,
        status: marketingCampaign.status,
        metrics: marketingCampaign.metrics,
        contactCount: sql<number>`(SELECT COUNT(*) FROM ${contactCampaign} WHERE ${contactCampaign.campaignCode} = ${marketingCampaign.campaignCode})`,
        createdAt: marketingCampaign.createdAt,
        updatedAt: marketingCampaign.updatedAt,
        createdBy: marketingCampaign.createdBy,
        updatedBy: marketingCampaign.updatedBy,
      })
      .from(marketingCampaign)
      .orderBy(desc(marketingCampaign.createdAt));
  }),

  getActiveCampaigns: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        id: marketingCampaign.id,
        name: marketingCampaign.name,
        campaignCode: marketingCampaign.campaignCode,
        description: marketingCampaign.description,
        type: marketingCampaign.type,
        status: marketingCampaign.status,
        metrics: marketingCampaign.metrics,
        contactCount: sql<number>`(SELECT COUNT(*) FROM ${contactCampaign} WHERE ${contactCampaign.campaignCode} = ${marketingCampaign.campaignCode})`,
        createdAt: marketingCampaign.createdAt,
        updatedAt: marketingCampaign.updatedAt,
        createdBy: marketingCampaign.createdBy,
        updatedBy: marketingCampaign.updatedBy,
      })
      .from(marketingCampaign)
      .where(eq(marketingCampaign.status, 'active'))
      .orderBy(desc(marketingCampaign.createdAt));
  }),

  getCampaignByCode: protectedProcedure.input(z.object({ code: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select({
        id: marketingCampaign.id,
        name: marketingCampaign.name,
        campaignCode: marketingCampaign.campaignCode,
        description: marketingCampaign.description,
        type: marketingCampaign.type,
        status: marketingCampaign.status,
        metrics: marketingCampaign.metrics,
        contactCount: sql<number>`(SELECT COUNT(*) FROM ${contactCampaign} WHERE ${contactCampaign.campaignCode} = ${input.code})`,
        createdAt: marketingCampaign.createdAt,
        updatedAt: marketingCampaign.updatedAt,
      })
      .from(marketingCampaign)
      .where(eq(marketingCampaign.campaignCode, input.code))
      .then((rows) => rows[0]);
  }),

  getCampaignContacts: protectedProcedure.input(z.object({ code: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select({
        id: contact.id,
        name: contact.name,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        status: contact.status,
        joinedAt: contactCampaign.joinedAt,
      })
      .from(contactCampaign)
      .innerJoin(contact, eq(contactCampaign.contactId, contact.id))
      .where(eq(contactCampaign.campaignCode, input.code));
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
      return ctx.db
        .insert(marketingCampaign)
        .values({
          ...input,
          createdBy: ctx.session.user.id,
        })
        .returning();
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
      return ctx.db
        .update(marketingCampaign)
        .set({
          ...updateData,
          updatedBy: ctx.session.user.id,
        })
        .where(eq(marketingCampaign.campaignCode, code));
    }),

  deleteCampaign: protectedProcedure.input(z.object({ code: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.delete(marketingCampaign).where(eq(marketingCampaign.campaignCode, input.code));
  }),
});
