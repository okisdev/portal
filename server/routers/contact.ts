import { activitySubTypeSchema, activityTypeSchema, prioritySchema, statusSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { sendEmail } from '@/utils/email';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const contactRouter = createTRPCRouter({
  getAllContacts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.portal_contact.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
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
        return ctx.db.portal_contact.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
        });
      }

      return ctx.db.portal_contact.findMany({
        where: {
          OR: [
            { firstName: { contains: input.query, mode: 'insensitive' } },
            { lastName: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
            { phone: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: input.limit,
      });
    }),

  getContactById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const contact = await ctx.db.portal_contact.findUnique({
      where: { id: input.id },
      include: {
        campaigns: {
          include: {
            campaign: true,
          },
        },
        teams: {
          include: {
            team: true,
          },
        },
        leadingTeams: true,
        subLeadingTeams: true,
        referralTeams: true,
      },
    });

    if (!contact) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
    }

    return {
      ...contact,
      campaigns: contact.campaigns.map((cc) => ({
        code: cc.campaign.campaignCode,
        name: cc.campaign.name,
      })),
      teams: contact.teams.map((tc) => ({
        id: tc.team.id,
        name: tc.team.name,
      })),
      leadingTeams: contact.leadingTeams.map((t) => ({
        id: t.id,
        name: t.name,
      })),
      subLeadingTeams: contact.subLeadingTeams.map((t) => ({
        id: t.id,
        name: t.name,
      })),
      referralTeams: contact.referralTeams.map((t) => ({
        id: t.id,
        name: t.name,
      })),
    };
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
      const existingContact = await ctx.db.portal_contact.findUnique({
        where: { email: input.email },
      });

      if (existingContact) return existingContact;

      // If campaignCode is an email, treat it as a referral
      let referralContact = null;
      if (typeof input.campaignCode === 'string' && input.campaignCode.includes('@')) {
        referralContact = await ctx.db.portal_contact.findUnique({
          where: { email: input.campaignCode },
        });
      }

      const result = await ctx.db.portal_contact.create({
        data: {
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
        },
      });

      // Log contact creation activity
      await createContactActivityHelper(ctx, {
        contactId: result.id,
        type: 'CONTACT',
        subType: 'CONTACT_CREATED',
        description: `Contact ${result.name} (${result.email}) was created${input.source ? ` from ${input.source}` : ''}.`,
        metadata: { source: input.source, campaignCode: input.campaignCode },
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
      });

      // Handle referral case
      if (referralContact) {
        await createContactActivityHelper(ctx, {
          contactId: result.id,
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
        const campaign = await ctx.db.portal_marketingCampaign.findUnique({
          where: { campaignCode },
        });

        if (!campaign) continue;

        await ctx.db.portal_contactCampaign.create({
          data: {
            contactId: result.id,
            campaignCode,
          },
        });

        // Log campaign assignment activity
        await createContactActivityHelper(ctx, {
          contactId: result.id,
          type: 'CAMPAIGN',
          subType: 'CAMPAIGN_ASSIGNED',
          description: `Contact ${result.name} (${result.email}) was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: { campaign },
        });
      }

      return result;
    }),

  updateContactRemark: protectedProcedure.input(z.object({ id: z.string(), remark: z.string(), oldRemark: z.string().optional() })).mutation(async ({ ctx, input }) => {
    await ctx.db.portal_contact.update({
      where: { id: input.id },
      data: { remark: input.remark },
    });

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
      const existing = await ctx.db.portal_contactCampaign.findFirst({
        where: {
          contactId: input.contactId,
          campaignCode: input.campaignCode,
        },
      });

      if (existing) return existing;

      const campaign = await ctx.db.portal_marketingCampaign.findUnique({
        where: { campaignCode: input.campaignCode },
      });

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'CAMPAIGN',
        subType: 'CAMPAIGN_ASSIGNED',
        description: `Contact was assigned to campaign: ${campaign?.name} (${campaign?.campaignCode}).`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: { campaign },
      });

      return ctx.db.portal_contactCampaign.create({
        data: {
          contactId: input.contactId,
          campaignCode: input.campaignCode,
        },
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
      const campaign = await ctx.db.portal_marketingCampaign.findUnique({
        where: { campaignCode: input.campaignCode },
      });

      const result = await ctx.db.portal_contactCampaign.deleteMany({
        where: {
          contactId: input.contactId,
          campaignCode: input.campaignCode,
        },
      });

      await createContactActivityHelper(ctx, {
        contactId: input.contactId,
        type: 'CAMPAIGN',
        subType: 'CAMPAIGN_REMOVED',
        description: `Contact was removed from campaign: ${campaign?.name} (${campaign?.campaignCode}).`,
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
        metadata: { campaign },
      });

      return result;
    }),

  deleteContact: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Get contact details before deletion for activity log
    const contactDetails = await ctx.db.portal_contact.findUnique({
      where: { id: input.id },
      select: {
        name: true,
        email: true,
      },
    });

    // Log deletion activity before actually deleting
    await createContactActivityHelper(ctx, {
      contactId: input.id,
      type: 'CONTACT',
      subType: 'CONTACT_DELETED',
      description: `Contact ${contactDetails?.name} (${contactDetails?.email}) was deleted.`,
      metadata: { name: contactDetails?.name, email: contactDetails?.email },
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
    });

    return ctx.db.portal_contact.delete({
      where: { id: input.id },
    });
  }),

  getContactActivities: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.portal_contactActivity.findMany({
      where: { contactId: input.id },
      orderBy: { createdAt: 'asc' },
    });
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
      await ctx.db.portal_contactActivity.create({
        data: {
          contactId: input.contactId,
          userId: ctx.session?.user.id,
          type: input.type,
          subType: input.subType,
          initiatorType: input.initiatorType,
          initiatorId: input.initiatorId,
          description: input.description,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        },
      });

      // Handle @mentions
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
                type: 'contacts',
                id: input.contactId,
              }),
            },
          });
        }
      }
    }),

  deleteContactActivity: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.portal_contactActivity.delete({
      where: { id: input.id },
    });
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
      const currentContact = await ctx.db.portal_contact.findUnique({
        where: { id },
      });

      if (!currentContact) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
      }

      // Only update name if firstName or lastName is provided
      const firstName = input.firstName ?? currentContact.firstName;
      const lastName = input.lastName ?? currentContact.lastName;
      const name = `${firstName} ${lastName}`.trim();

      const result = await ctx.db.portal_contact.update({
        where: { id },
        data: { ...updateData, name },
      });

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
      const existingContacts = await ctx.db.portal_contact.findMany({
        where: {
          email: {
            in: input.emails,
          },
        },
        select: {
          email: true,
        },
      });

      return existingContacts.map((contact) => contact.email);
    }),

  getContactsByCampaignId: protectedProcedure.input(z.object({ campaignCode: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.portal_contactCampaign.findMany({
      where: {
        campaignCode: input.campaignCode,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
            status: true,
          },
        },
      },
      select: {
        joinedAt: true,
        contact: true,
      },
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
        await ctx.db.portal_contactActivity.create({
          data: {
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
          },
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
      const results: any[] = [];
      const errors: Array<{ email: string; error: string }> = [];

      // Get all unique emails for existence check
      const emails = [...new Set(input.contacts.map((contact) => contact.email))];
      const existingContacts = await ctx.db.portal_contact.findMany({
        where: {
          email: {
            in: emails,
          },
        },
        select: {
          email: true,
        },
      });

      const existingEmails = new Set(existingContacts.map((c) => c.email));

      // Process contacts that don't exist yet
      const newContacts = input.contacts.filter((contact) => !existingEmails.has(contact.email));

      try {
        // Create all contacts in a transaction
        const createdContacts = await ctx.db.$transaction(async (tx) => {
          const created = [];

          for (const contactData of newContacts) {
            try {
              // If campaignCode is an email, treat it as a referral
              let referralContact = null;
              if (typeof contactData.campaignCode === 'string' && contactData.campaignCode.includes('@')) {
                referralContact = await tx.portal_contact.findUnique({
                  where: { email: contactData.campaignCode },
                });
              }

              const result = await tx.portal_contact.create({
                data: {
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
                },
              });

              const newContact = result;
              created.push(newContact);

              // Handle campaign assignments within the transaction
              const campaignCodes = typeof contactData.campaignCode === 'string' ? (contactData.campaignCode.includes('@') ? [] : [contactData.campaignCode]) : contactData.campaignCode || [];

              for (const campaignCode of campaignCodes) {
                const campaign = await tx.portal_marketingCampaign.findUnique({
                  where: { campaignCode },
                });

                if (!campaign) continue;

                await tx.portal_contactCampaign.create({
                  data: {
                    contactId: newContact.id,
                    campaignCode,
                  },
                });
              }
            } catch (error) {
              console.error('Error creating contact:', error);
              errors.push({ email: contactData.email, error: error instanceof Error ? error.message : 'Unknown error' });
            }
          }

          return created;
        });

        // After transaction commits, create activities for each contact
        await Promise.all(
          createdContacts.map(async (newContact) => {
            try {
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
              if (newContact.source === 'referral') {
                const referralContact = await ctx.db.portal_contact.findUnique({
                  where: { email: newContact.source },
                });

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
              }

              // Log campaign assignments
              const campaigns = await ctx.db.portal_contactCampaign.findMany({
                where: { contactId: newContact.id },
                include: {
                  campaign: true,
                },
              });

              await Promise.all(
                campaigns.map(async ({ campaign }) => {
                  await createContactActivityHelper(ctx, {
                    contactId: newContact.id,
                    type: 'CAMPAIGN',
                    subType: 'CAMPAIGN_ASSIGNED',
                    description: `Contact ${newContact.name} (${newContact.email}) was assigned to campaign: ${campaign.name} (${campaign.campaignCode}).`,
                    initiatorType: 'user',
                    initiatorId: ctx.session?.user.id,
                    metadata: { campaign },
                  });
                })
              );
            } catch (error) {
              console.error('Error creating contact activities:', error);
              errors.push({ email: newContact.email, error: error instanceof Error ? error.message : 'Unknown error' });
            }
          })
        );

        results.push(...createdContacts);
      } catch (error) {
        console.error('Transaction error:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create contacts batch' });
      }

      return {
        created: results,
        existing: existingContacts,
        errors,
      };
    }),
});
