import { Contact } from '@/database/models/contact';
import { ContactActivity } from '@/database/models/contactActivity';
import { ContactCampaign } from '@/database/models/contactCampaign';
import { MarketingCampaign } from '@/database/models/marketingCampaign';
import { User } from '@/database/models/user';
import { UserNotifications } from '@/database/models/userNotifications';
import { activitySubTypeSchema, activityTypeSchema, prioritySchema, statusSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { sendEmail } from '@/utils/email';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const contactRouter = createTRPCRouter({
  getAllContacts: protectedProcedure.query(({ ctx }) => {
    return Contact.find({ orderBy: { createdAt: 'desc' } });
  }),

  getContactByQuery: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.query.trim()) {
        return Contact.find({ orderBy: { createdAt: 'desc' }, take: input.limit });
      }

      return Contact.find({
        where: {
          OR: [
            { firstName: { contains: input.query, mode: 'insensitive' } },
            { lastName: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
            { phone: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  getContactById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return Contact.findOne({
      where: { id: input.id },
      include: {
        campaigns: true,
        teams: true,
      },
    });
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
        companyId: z.string().nullable().optional(),
        source: z.string().optional(),
        remark: z.string().optional(),
        status: statusSchema.optional(),
        campaignCode: z.union([z.string(), z.array(z.string())]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingContact = await Contact.findOne({ where: { email: input.email } });

      if (existingContact) return existingContact;

      // If campaignCode is an email, treat it as a referral
      let referralContact = null;
      if (typeof input.campaignCode === 'string' && input.campaignCode.includes('@')) {
        referralContact = await Contact.findOne({ where: { email: input.campaignCode } });
      }

      const result = await Contact.create({
        name: input.name ?? `${input.firstName ?? ''} ${input.lastName ?? ''}`,
        firstName: input.firstName ?? '',
        lastName: input.lastName ?? '',
        email: input.email,
        phone: input.phone ?? '',
        company: input.company ?? '',
        companyId: input.companyId ?? null,
        source: input.source ?? (referralContact ? 'referral' : ''),
        status: input.status ?? 'lead',
        remark: input.remark ?? '',
      });

      // Log contact creation activity
      await createContactActivityHelper(ctx, {
        contactId: result[0].id,
        type: 'CONTACT',
        subType: 'CONTACT_CREATED',
        description: `Contact ${result[0].name} (${result[0].email}) was created${input.source ? ` from ${input.source}` : ''}.`,
        metadata: { source: input.source, campaignCode: input.campaignCode },
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
      });

      // Handle referral case
      if (referralContact) {
        await createContactActivityHelper(ctx, {
          contactId: result[0].id,
          type: 'CONTACT',
          subType: 'CONTACT_CREATED',
          description: `Contact was referred by ${referralContact.name} (${referralContact.email})`,
          metadata: { referralId: referralContact.id, referralEmail: referralContact.email },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      // Handle campaign assignments
      const campaignCodes = typeof input.campaignCode === 'string' ? (input.campaignCode.includes('@') ? [] : [input.campaignCode]) : input.campaignCode || [];

      for (const campaignCode of campaignCodes) {
        const campaign = await MarketingCampaign.findOne({ where: { campaignCode } });

        if (!campaign) continue;

        await ContactCampaign.create({
          contactId: result[0].id,
          campaignCode,
        });

        // Log campaign assignment activity
        await createContactActivityHelper(ctx, {
          contactId: result[0].id,
          type: 'CAMPAIGN',
          subType: 'CAMPAIGN_ASSIGNED',
          description: `Contact ${result[0].name} (${result[0].email}) was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: { campaign },
        });
      }

      return result[0];
    }),

  updateContactRemark: protectedProcedure.input(z.object({ id: z.string(), remark: z.string(), oldRemark: z.string().optional() })).mutation(async ({ ctx, input }) => {
    await Contact.updateOne({ id: input.id }, { remark: input.remark });

    // Log remark update activity
    await createContactActivityHelper(ctx, {
      contactId: input.id,
      type: 'ENGAGEMENT',
      subType: 'REMARK_UPDATED',
      description: `Contact remark was updated to: ${input.remark}`,
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
      metadata: {
        oldRemark: input.oldRemark,
        newRemark: input.remark,
      },
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
      const existing = await ContactCampaign.findOne({ where: { contactId: input.contactId, campaignCode: input.campaignCode } });

      if (existing) return existing;

      const campaign = await MarketingCampaign.findOne({ where: { campaignCode: input.campaignCode } });

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'CAMPAIGN',
        subType: 'CAMPAIGN_ASSIGNED',
        description: `Contact was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: { campaign },
      });

      return ContactCampaign.create({
        contactId: input.contactId,
        campaignCode: input.campaignCode,
      });
    }),

  removeContactFromCampaign: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        campaignCode: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await MarketingCampaign.findOne({ where: { campaignCode: input.campaignCode } });

      const result = await ContactCampaign.deleteOne({ where: { contactId: input.contactId, campaignCode: input.campaignCode } });

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'CAMPAIGN',
        subType: 'CAMPAIGN_REMOVED',
        description: `Contact was removed from campaign: ${campaign.name} (${campaign.campaignCode}).`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: { campaign },
      });

      return result;
    }),

  deleteContact: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Get contact details before deletion for activity log
    const contactDetails = await Contact.findOne({ where: { id: input.id } });

    // Log deletion activity before actually deleting
    await createContactActivityHelper(ctx, {
      contactId: input.id,
      type: 'CONTACT',
      subType: 'CONTACT_DELETED',
      description: `Contact ${contactDetails.name} (${contactDetails.email}) was deleted.`,
      metadata: { name: contactDetails.name, email: contactDetails.email },
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
    });

    return Contact.deleteOne({ id: input.id });
  }),

  getContactActivities: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ContactActivity.find({ where: { contactId: input.id }, orderBy: { createdAt: 'asc' } });
  }),

  createContactActivity: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        type: activityTypeSchema,
        subType: activitySubTypeSchema,
        description: z.string(),
        initiatorType: z.enum(['user', 'contact', 'system']),
        initiatorId: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ContactActivity.create({
        contactId: input.contactId,
        userId: ctx.session?.user.id,
        type: input.type,
        subType: input.subType,
        initiatorType: input.initiatorType,
        initiatorId: input.initiatorId,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });

      // Handle @mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = input.description.match(mentionRegex)?.map((m) => m.slice(1)) || [];

      if (mentions.length > 0) {
        // Get all mentioned users
        const mentionedUsers = await User.find({ where: { username: { in: mentions } } });

        // Create notifications for mentioned users
        for (const mentionedUser of mentionedUsers) {
          await UserNotifications.create({
            userId: mentionedUser.id,
            type: 'message',
            title: `${ctx.session?.user.name || 'Someone'} mentioned you in a note`,
            message: input.description,
            metadata: JSON.stringify({
              type: 'contacts',
              id: input.contactId,
            }),
          });
        }
      }
    }),

  deleteContactActivity: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ContactActivity.deleteOne({ id: input.id });
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
        companyId: z.string().nullable().optional(),
        priority: prioritySchema.optional(),
        workExperience: z.string().optional(),
        currentRole: z.string().optional(),
        industry: z.string().optional(),
        skills: z.string().optional(),
        status: statusSchema.optional(),
        source: z.string().optional(),
        lastContactedAt: z.date().optional().nullable(),
        nextFollowUpAt: z.date().optional().nullable(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get current contact data for comparison
      const currentContact = await Contact.findOne({ where: { id } });

      // Only update name if firstName or lastName is provided
      const firstName = input.firstName ?? currentContact.firstName;
      const lastName = input.lastName ?? currentContact.lastName;
      const name = `${firstName} ${lastName}`.trim();

      const result = await Contact.updateOne({ id }, { ...updateData, name });

      // Log status change if status was updated
      if (input.status && input.status !== currentContact.status) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'STATUS',
          subType: 'STATUS_CHANGED',
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
          type: 'STATUS',
          subType: 'PRIORITY_CHANGED',
          description: `Contact priority changed from ${currentContact.priority} to ${input.priority}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            oldPriority: currentContact.priority,
            newPriority: input.priority,
          },
        });
      }

      if (input.lastContactedAt === null) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'LAST_CONTACTED',
          description: 'Last contacted date removed',
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      if (input.nextFollowUpAt === null) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'NEXT_FOLLOW_UP',
          description: 'Next follow up date removed',
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      if (input.lastContactedAt) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'LAST_CONTACTED',
          description: `Last contacted date updated to ${input.lastContactedAt}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      if (input.nextFollowUpAt) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'NEXT_FOLLOW_UP',
          description: `Next follow up date updated to ${input.nextFollowUpAt}`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      // Log general update for other field changes
      const changedFields = Object.keys(updateData).filter((key) => updateData[key as keyof typeof updateData] !== currentContact[key as keyof typeof currentContact]);

      if (changedFields.length > 0) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'CONTACT',
          subType: 'CONTACT_UPDATED',
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
      const existingContacts = await Contact.find({ email: { $in: input.emails } }, { email: 1 });
      return existingContacts.map((contact) => contact.email);
    }),

  getContactsByCampaignId: protectedProcedure.input(z.object({ campaignCode: z.string() })).query(async ({ ctx, input }) => {
    const contactCampaigns = await ContactCampaign.find({ campaignCode: input.campaignCode }).populate('contactId');

    return contactCampaigns.map((campaign) => {
      const contact = campaign.contactId;
      return {
        id: contact.id,
        name: contact.name,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        status: contact.status,
        joinedAt: campaign.joinedAt,
      };
    });
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
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User email is not set' });
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
        await ContactActivity.create({
          type: 'ENGAGEMENT',
          subType: 'EMAIL_SENT',
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
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send email' });
      }
    }),

  createContacts: protectedProcedure
    .input(
      z.object({
        contacts: z.array(
          z.object({
            name: z.string().optional(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string(),
            phone: z.string().optional(),
            company: z.string().optional(),
            companyId: z.string().nullable().optional(),
            source: z.string().optional(),
            remark: z.string().optional(),
            status: statusSchema.optional(),
            campaignCode: z.union([z.string(), z.array(z.string())]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];
      const errors = [];

      // Get all unique emails for existence check
      const emails = [...new Set(input.contacts.map((contact) => contact.email))];
      const existingContacts = await Contact.find({ email: { $in: emails } });
      const existingEmails = new Set(existingContacts.map((c) => c.email));

      // Process contacts that don't exist yet
      const newContacts = input.contacts.filter((contact) => !existingEmails.has(contact.email));

      try {
        // Create contacts one by one since Mongoose doesn't support transactions in the same way
        for (const contactData of newContacts) {
          try {
            // If campaignCode is an email, treat it as a referral
            let referralContact = null;
            if (typeof contactData.campaignCode === 'string' && contactData.campaignCode.includes('@')) {
              referralContact = await Contact.findOne({ email: contactData.campaignCode });
            }

            const newContact = await Contact.create({
              name: contactData.name ?? `${contactData.firstName ?? ''} ${contactData.lastName ?? ''}`,
              firstName: contactData.firstName ?? '',
              lastName: contactData.lastName ?? '',
              email: contactData.email,
              phone: contactData.phone ?? '',
              company: contactData.company ?? '',
              companyId: contactData.companyId ?? null,
              source: contactData.source ?? (referralContact ? 'referral' : ''),
              status: contactData.status ?? 'lead',
              remark: contactData.remark ?? '',
            });

            results.push(newContact);

            // Handle campaign assignments
            const campaignCodes = typeof contactData.campaignCode === 'string' ? (contactData.campaignCode.includes('@') ? [] : [contactData.campaignCode]) : contactData.campaignCode || [];

            for (const campaignCode of campaignCodes) {
              const campaign = await MarketingCampaign.findOne({ campaignCode });
              if (!campaign) continue;

              await ContactCampaign.create({
                contactId: newContact.id,
                campaignCode,
              });

              // Log campaign assignment activity
              await createContactActivityHelper(ctx, {
                contactId: newContact.id,
                type: 'CAMPAIGN',
                subType: 'CAMPAIGN_ASSIGNED',
                description: `Contact ${newContact.name} (${newContact.email}) was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
                initiatorType: 'user',
                initiatorId: ctx.session?.user.id,
                metadata: { campaign },
              });
            }

            // Log contact creation activity
            await createContactActivityHelper(ctx, {
              contactId: newContact.id,
              type: 'CONTACT',
              subType: 'CONTACT_CREATED',
              description: `Contact ${newContact.name} (${newContact.email}) was created${newContact.source ? ` from ${newContact.source}` : ''}.`,
              metadata: { source: newContact.source },
              initiatorType: 'user',
              initiatorId: ctx.session?.user.id,
            });

            // Handle referral case
            if (referralContact) {
              await createContactActivityHelper(ctx, {
                contactId: newContact.id,
                type: 'CONTACT',
                subType: 'CONTACT_CREATED',
                description: `Contact was referred by ${referralContact.name} (${referralContact.email})`,
                metadata: { referralId: referralContact.id, referralEmail: referralContact.email },
                initiatorType: 'user',
                initiatorId: ctx.session?.user.id,
              });
            }
          } catch (error) {
            console.error('Error creating contact:', error);
            errors.push({ email: contactData.email, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
      } catch (error) {
        console.error('Error in batch operation:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create contacts batch' });
      }

      return {
        created: results,
        existing: existingContacts,
        errors,
      };
    }),
});
