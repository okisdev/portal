import { contact, contactCampaign, marketingCampaign } from '@/drizzle/schema';
import {} from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { type SQL, and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

export const marketingRouter = createTRPCRouter({
  // Campaign Management
  getAllCampaigns: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(marketingCampaign).orderBy(desc(marketingCampaign.createdAt));
  }),

  getCampaignById: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select({
        id: marketingCampaign.id,
        name: marketingCampaign.name,
        description: marketingCampaign.description,
        type: marketingCampaign.type,
        status: marketingCampaign.status,
        startDate: marketingCampaign.startDate,
        endDate: marketingCampaign.endDate,
        budget: marketingCampaign.budget,
        targetAudience: marketingCampaign.targetAudience,
        goals: marketingCampaign.goals,
        metrics: marketingCampaign.metrics,
        contactCount: sql<number>`COUNT(DISTINCT ${contactCampaign.contactId})`,
        convertedCount: sql<number>`COUNT(DISTINCT CASE WHEN ${contactCampaign.status} = 'converted' THEN ${contactCampaign.contactId} END)`,
        createdAt: marketingCampaign.createdAt,
        updatedAt: marketingCampaign.updatedAt,
      })
      .from(marketingCampaign)
      .leftJoin(contactCampaign, eq(contactCampaign.campaignId, marketingCampaign.id))
      .where(eq(marketingCampaign.id, input.id))
      .groupBy(marketingCampaign.id)
      .then((rows) => rows[0]);
  }),

  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.enum(['email', 'social', 'event', 'referral', 'other']),
        status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        targetAudience: z.string().optional(), // JSON string
        goals: z.string().optional(), // JSON string
        metrics: z.string().optional(), // JSON string
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
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['email', 'social', 'event', 'referral', 'other']).optional(),
        status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        targetAudience: z.string().optional(),
        goals: z.string().optional(),
        metrics: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(marketingCampaign)
        .set({
          ...updateData,
          updatedBy: ctx.session.user.id,
        })
        .where(eq(marketingCampaign.id, id));
    }),

  deleteCampaign: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.delete(marketingCampaign).where(eq(marketingCampaign.id, input.id));
  }),

  // Campaign Contact Management
  getCampaignContacts: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        status: z.enum(['pending', 'engaged', 'converted', 'bounced', 'unsubscribed']).optional(),
      })
    )
    .query(({ ctx, input }) => {
      const baseCondition = eq(contactCampaign.campaignId, input.campaignId);
      const conditions = input.status ? and(baseCondition, eq(contactCampaign.status, input.status)) : baseCondition;

      return ctx.db
        .select({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          company: contact.company,
          status: contactCampaign.status,
          signupDate: contactCampaign.signupDate,
          conversionDate: contactCampaign.conversionDate,
          source: contactCampaign.source,
        })
        .from(contactCampaign)
        .innerJoin(contact, eq(contact.id, contactCampaign.contactId))
        .where(conditions)
        .orderBy(desc(contactCampaign.signupDate));
    }),

  addContactToCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        contactId: z.string(),
        status: z.enum(['pending', 'engaged', 'converted', 'bounced', 'unsubscribed']).optional(),
        source: z.string().optional(),
        metadata: z.string().optional(), // JSON string
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if contact is already in campaign
      const existing = await ctx.db
        .select()
        .from(contactCampaign)
        .where(and(eq(contactCampaign.campaignId, input.campaignId), eq(contactCampaign.contactId, input.contactId)))
        .then((rows) => rows[0]);

      if (existing) return existing;

      return ctx.db
        .insert(contactCampaign)
        .values({
          campaignId: input.campaignId,
          contactId: input.contactId,
          status: input.status ?? 'pending',
          source: input.source,
          metadata: input.metadata,
        })
        .returning();
    }),

  updateContactCampaignStatus: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        contactId: z.string(),
        status: z.enum(['pending', 'engaged', 'converted', 'bounced', 'unsubscribed']),
        conversionDate: z.date().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const updateData: any = {
        status: input.status,
      };

      if (input.status === 'converted') {
        updateData.conversionDate = input.conversionDate ?? new Date();
      }

      return ctx.db
        .update(contactCampaign)
        .set(updateData)
        .where(and(eq(contactCampaign.campaignId, input.campaignId), eq(contactCampaign.contactId, input.contactId)));
    }),

  removeContactFromCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.delete(contactCampaign).where(and(eq(contactCampaign.campaignId, input.campaignId), eq(contactCampaign.contactId, input.contactId)));
    }),

  // Campaign Analytics
  getCampaignMetrics: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const baseCondition = eq(contactCampaign.campaignId, input.campaignId);
      const dateConditions = [input.startDate && gte(contactCampaign.signupDate, input.startDate), input.endDate && lte(contactCampaign.signupDate, input.endDate)].filter(Boolean) as SQL[];

      const conditions = dateConditions.length > 0 ? and(baseCondition, ...dateConditions) : baseCondition;

      return ctx.db
        .select({
          totalContacts: sql<number>`COUNT(DISTINCT ${contactCampaign.contactId})`,
          engagedContacts: sql<number>`COUNT(DISTINCT CASE WHEN ${contactCampaign.status} = 'engaged' THEN ${contactCampaign.contactId} END)`,
          convertedContacts: sql<number>`COUNT(DISTINCT CASE WHEN ${contactCampaign.status} = 'converted' THEN ${contactCampaign.contactId} END)`,
          bouncedContacts: sql<number>`COUNT(DISTINCT CASE WHEN ${contactCampaign.status} = 'bounced' THEN ${contactCampaign.contactId} END)`,
          unsubscribedContacts: sql<number>`COUNT(DISTINCT CASE WHEN ${contactCampaign.status} = 'unsubscribed' THEN ${contactCampaign.contactId} END)`,
          averageConversionTime: sql<number>`
            AVG(EXTRACT(EPOCH FROM (${contactCampaign.conversionDate} - ${contactCampaign.signupDate})) / 86400)
            FILTER (WHERE ${contactCampaign.status} = 'converted')
          `,
        })
        .from(contactCampaign)
        .where(conditions)
        .then((rows) => rows[0]);
    }),
});
