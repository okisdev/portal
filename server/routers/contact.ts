import { contact, contactActivity, contactCampaign, marketingCampaign, team, teamContact } from '@/drizzle/schema';
import { activityTypeSchema, prioritySchema, statusSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { sendEmail } from '@/utils/email';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

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
        campaigns: sql<Array<{ code: string; name: string }>>`
          (SELECT json_agg(json_build_object('code', mc."campaignCode", 'name', mc.name))
           FROM ${marketingCampaign} mc 
           INNER JOIN ${contactCampaign} cc ON cc."campaignCode" = mc."campaignCode"
           WHERE cc."contactId" = ${input.id})`,
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
        status: statusSchema.optional(),
        campaignCode: z.union([z.string(), z.array(z.string())]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.email, input.email))
        .then((rows) => rows[0]);

      if (existingContact) return existingContact;

      // If campaignCode is an email, treat it as a referral
      let referralContact = null;
      if (typeof input.campaignCode === 'string' && input.campaignCode.includes('@')) {
        referralContact = await ctx.db
          .select()
          .from(contact)
          .where(eq(contact.email, input.campaignCode))
          .then((rows) => rows[0]);
      }

      const result = await ctx.db
        .insert(contact)
        .values({
          name: input.name ?? `${input.firstName ?? ''} ${input.lastName ?? ''}`,
          firstName: input.firstName ?? '',
          lastName: input.lastName ?? '',
          email: input.email,
          phone: input.phone ?? '',
          company: input.company ?? '',
          source: input.source ?? (referralContact ? 'referral' : ''),
          status: input.status ?? 'lead',
          remark: input.remark ?? '',
        })
        .returning();

      // Log contact creation activity
      await createContactActivityHelper(ctx, {
        contactId: result[0].id,
        type: 'CONTACT_CREATED',
        title: 'Contact Created',
        description: `Contact ${result[0].name} (${result[0].email}) was created${input.source ? ` from ${input.source}` : ''}.`,
        metadata: { source: input.source, campaignCode: input.campaignCode },
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
      });

      // Handle referral case
      if (referralContact) {
        await createContactActivityHelper(ctx, {
          contactId: result[0].id,
          type: 'CONTACT_CREATED',
          title: 'Referral Added',
          description: `Contact was referred by ${referralContact.name} (${referralContact.email})`,
          metadata: { referralId: referralContact.id, referralEmail: referralContact.email },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      // Handle campaign assignments
      const campaignCodes = typeof input.campaignCode === 'string' ? (input.campaignCode.includes('@') ? [] : [input.campaignCode]) : input.campaignCode || [];

      for (const campaignCode of campaignCodes) {
        const campaign = await ctx.db
          .select()
          .from(marketingCampaign)
          .where(eq(marketingCampaign.campaignCode, campaignCode))
          .then((rows) => rows[0]);

        if (!campaign) continue;

        await ctx.db.insert(contactCampaign).values({
          contactId: result[0].id,
          campaignCode,
        });

        // Log campaign assignment activity
        await createContactActivityHelper(ctx, {
          contactId: result[0].id,
          type: 'CAMPAIGN_ASSIGNED',
          title: 'Campaign Assigned',
          description: `Contact ${result[0].name} (${result[0].email}) was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
          metadata: { campaign },
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

  addContactToCampaign: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        campaignCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already in campaign
      const existing = await ctx.db
        .select()
        .from(contactCampaign)
        .where(and(eq(contactCampaign.contactId, input.contactId), eq(contactCampaign.campaignCode, input.campaignCode)))
        .then((rows) => rows[0]);

      if (existing) return existing;

      const campaign = await ctx.db
        .select()
        .from(marketingCampaign)
        .where(eq(marketingCampaign.campaignCode, input.campaignCode))
        .then((rows) => rows[0]);

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'CAMPAIGN_ASSIGNED',
        title: 'Campaign Assigned',
        description: `Contact was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: { campaign },
      });

      return ctx.db
        .insert(contactCampaign)
        .values({
          contactId: input.contactId,
          campaignCode: input.campaignCode,
        })
        .returning();
    }),

  removeContactFromCampaign: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        campaignCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db
        .select()
        .from(marketingCampaign)
        .where(eq(marketingCampaign.campaignCode, input.campaignCode))
        .then((rows) => rows[0]);

      const result = await ctx.db.delete(contactCampaign).where(and(eq(contactCampaign.contactId, input.contactId), eq(contactCampaign.campaignCode, input.campaignCode)));

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'CAMPAIGN_REMOVED',
        title: 'Campaign Removed',
        description: `Contact was removed from campaign: ${campaign.name} (${campaign.campaignCode}).`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: { campaign },
      });

      return result;
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
        type: activityTypeSchema,
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

      // Get current contact data for comparison
      const currentContact = await ctx.db
        .select()
        .from(contact)
        .where(eq(contact.id, id))
        .then((rows) => rows[0]);

      // Only update name if firstName or lastName is provided
      const firstName = input.firstName ?? currentContact.firstName;
      const lastName = input.lastName ?? currentContact.lastName;
      const name = `${firstName} ${lastName}`.trim();

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

      if (input.lastContactedAt) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'LAST_CONTACTED_UPDATED',
          title: 'Last Contacted Updated',
          description: `Last contacted date updated to ${input.lastContactedAt}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
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

  getContactsByCampaignId: protectedProcedure.input(z.object({ campaignCode: z.string() })).query(async ({ ctx, input }) => {
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
      .where(eq(contactCampaign.campaignCode, input.campaignCode));
  }),

  sendEmail: protectedProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string(),
        content: z.string(),
        cc: z.array(z.string().email()),
        bcc: z.array(z.string().email()),
        attachments: z.array(z.any()),
        contactId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.session.user.email) {
          throw new Error('User email is not set');
        }

        await sendEmail({
          from: ctx.session.user.email,
          to: input.to,
          subject: input.subject,
          content: input.content,
          cc: input.cc,
          bcc: input.bcc,
          attachments: input.attachments,
        });

        // Log the email activity
        await ctx.db.insert(contactActivity).values({
          type: 'EMAIL_SENT',
          title: 'Email Sent',
          description: `Email sent to ${input.to} with subject: ${input.subject}`,
          initiatorType: 'user',
          userId: ctx.session.user.id,
          contactId: input.contactId,
          metadata: JSON.stringify({
            to: input.to,
            subject: input.subject,
            content: input.content,
            cc: input.cc,
            bcc: input.bcc,
            attachments: input.attachments,
          }),
        });

        return {
          success: true,
        };
      } catch (error) {
        throw new Error('Failed to send email');
      }
    }),
});
