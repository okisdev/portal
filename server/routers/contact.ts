import { contact, contactActivity, contactCampaign, marketingCampaign, team, teamContact } from '@/drizzle/schema';
import { prioritySchema, statusSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
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

  // Campaign Management
  'CAMPAIGN_ASSIGNED',
  'CAMPAIGN_UPDATED',
  'CAMPAIGN_REMOVED',

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

export const contactRouter = createTRPCRouter({
  getAllContacts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(contact).orderBy(desc(contact.createdAt));
  }),

  getContactByQuery: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db
      .select()
      .from(contact)
      .where(
        sql`${contact.firstName} ILIKE ${`%${input.query}%`} OR 
            ${contact.lastName} ILIKE ${`%${input.query}%`} OR 
            ${contact.email} ILIKE ${`%${input.query}%`}`
      )
      .limit(10);
  }),

  getContactById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db
      .select({
        id: contact.id,
        name: contact.name,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        source: contact.source,
        priority: contact.priority,
        workExperience: contact.workExperience,
        currentRole: contact.currentRole,
        industry: contact.industry,
        skills: contact.skills,
        status: contact.status,
        lastContactedAt: contact.lastContactedAt,
        remark: contact.remark,
        teams: sql<Array<{ id: string; name: string }>>`
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
           FROM ${team} t 
           INNER JOIN ${teamContact} tc ON tc."teamId" = t.id
           WHERE tc."contactId" = ${input.id})`,
        leadingTeams: sql<Array<{ id: string; name: string }>>`
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
           FROM ${team} t 
           WHERE t."leaderId" = ${input.id})`,
        subLeadingTeams: sql<Array<{ id: string; name: string }>>`
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
           FROM ${team} t 
           WHERE t."subLeaderId" = ${input.id})`,
        referralTeams: sql<Array<{ id: string; name: string }>>`
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
           FROM ${team} t 
           WHERE t."referralId" = ${input.id})`,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })
      .from(contact)
      .where(eq(contact.id, input.id))
      .then((rows) => rows[0]);
  }),

  createContact: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string(),
        phone: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
        remark: z.string().optional(),
        campaignId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.email, input.email))
        .then((rows) => rows[0]);

      if (existingContact) return existingContact;

      const result = await ctx.db
        .insert(contact)
        .values({
          name: input.name ?? `${input.firstName} ${input.lastName}` ?? '',
          firstName: input.firstName ?? '',
          lastName: input.lastName ?? '',
          email: input.email,
          phone: input.phone ?? '',
          company: input.company ?? '',
          source: input.source ?? '',
          remark: input.remark ?? '',
          campaignId: input.campaignId,
        })
        .returning();

      // Log contact creation activity
      await createContactActivityHelper(ctx, {
        contactId: result[0].id,
        type: 'CONTACT_CREATED',
        title: 'Contact Created',
        description: `Contact ${result[0].name} (${result[0].email}) was created${input.source ? ` from ${input.source}` : ''}.`,
        metadata: { source: input.source, campaignId: input.campaignId },
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
      });

      // If campaign is provided, create contact campaign entry
      if (input.campaignId) {
        await ctx.db.insert(contactCampaign).values({
          contactId: result[0].id,
          campaignId: input.campaignId,
          status: 'pending',
          source: input.source ?? 'direct',
        });

        const campaignCode = await ctx.db
          .select({ code: marketingCampaign.campaignCode, name: marketingCampaign.name })
          .from(marketingCampaign)
          .where(eq(marketingCampaign.id, input.campaignId))
          .then((rows) => rows[0]);

        // Log campaign assignment activity
        await createContactActivityHelper(ctx, {
          contactId: result[0].id,
          type: 'CAMPAIGN_ASSIGNED',
          title: 'Campaign Assigned',
          description: `Contact was assigned to campaign: ${campaignCode.name} (${campaignCode.code})`,
          metadata: { campaignId: input.campaignId, campaignCode: campaignCode.code },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      return result[0];
    }),

  updateContactRemark: protectedProcedure.input(z.object({ id: z.string(), remark: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.update(contact).set({ remark: input.remark }).where(eq(contact.id, input.id));

    // Log remark update activity
    await createContactActivityHelper(ctx, {
      contactId: input.id,
      type: 'NOTE_ADDED',
      title: 'Remark Updated',
      description: `Contact remark was updated to: ${input.remark}`,
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
    });
  }),

  deleteContact: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Get contact details before deletion for activity log
    const contactDetails = await ctx.db
      .select({
        name: contact.name,
        email: contact.email,
      })
      .from(contact)
      .where(eq(contact.id, input.id))
      .then((rows) => rows[0]);

    // Log deletion activity before actually deleting
    await createContactActivityHelper(ctx, {
      contactId: input.id,
      type: 'CONTACT_DELETED',
      title: 'Contact Deleted',
      description: `Contact ${contactDetails.name} (${contactDetails.email}) was deleted.`,
      metadata: { name: contactDetails.name, email: contactDetails.email },
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
    });

    return ctx.db.delete(contact).where(eq(contact.id, input.id));
  }),

  getContactActivities: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.select().from(contactActivity).where(eq(contactActivity.contactId, input.id)).orderBy(asc(contactActivity.createdAt));
  }),

  createContactActivity: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        type: activityTypeEnum,
        title: z.string(),
        description: z.string(),
        initiatorType: z.enum(['user', 'contact', 'system']),
        initiatorId: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(contactActivity).values({
        contactId: input.contactId,
        userId: ctx.session?.user.id,
        type: input.type,
        initiatorType: input.initiatorType,
        initiatorId: input.initiatorId,
        title: input.title,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
    }),

  deleteContactActivity: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.delete(contactActivity).where(eq(contactActivity.id, input.id));
  }),

  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        priority: prioritySchema.optional(),
        workExperience: z.string().optional(),
        currentRole: z.string().optional(),
        industry: z.string().optional(),
        skills: z.string().optional(),
        status: statusSchema.optional(),
        source: z.string().optional(),
        lastContactedAt: z.date().optional(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const name = `${input.firstName} ${input.lastName}`;

      // Get current contact data for comparison
      const currentContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.id, id))
        .then((rows) => rows[0]);

      const result = await ctx.db
        .update(contact)
        .set({ ...updateData, name })
        .where(eq(contact.id, id));

      // Log status change if status was updated
      if (input.status && input.status !== currentContact.status) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'STATUS_CHANGED',
          title: 'Status Changed',
          description: `Contact status changed from ${currentContact.status} to ${input.status}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            oldStatus: currentContact.status,
            newStatus: input.status,
          },
        });
      }

      // Log priority change if priority was updated
      if (input.priority && input.priority !== currentContact.priority) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'PRIORITY_CHANGED',
          title: 'Priority Changed',
          description: `Contact priority changed from ${currentContact.priority} to ${input.priority}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            oldPriority: currentContact.priority,
            newPriority: input.priority,
          },
        });
      }

      // Log general update for other field changes
      const changedFields = Object.keys(updateData).filter((key) => updateData[key as keyof typeof updateData] !== currentContact[key as keyof typeof currentContact]);

      if (changedFields.length > 0) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'CONTACT_UPDATED',
          title: 'Contact Updated',
          description: `Updated contact fields: ${changedFields.join(', ')}`,
          metadata: {
            changedFields,
            updates: changedFields.reduce(
              (acc, field) =>
                Object.assign(acc, {
                  [field]: {
                    old: currentContact[field as keyof typeof currentContact],
                    new: updateData[field as keyof typeof updateData],
                  },
                }),
              {} as Record<string, { old: any; new: any }>
            ),
          },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      return result;
    }),

  checkExistingContacts: publicProcedure
    .input(
      z.object({
        emails: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const existingContacts = await ctx.db
        .select({
          email: contact.email,
        })
        .from(contact)
        .where(inArray(contact.email, input.emails));

      return existingContacts.map((contact) => contact.email);
    }),

  getContactsByCampaignId: protectedProcedure.input(z.object({ campaignId: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.select().from(contact).where(eq(contact.campaignId, input.campaignId));
  }),
});
