import { contact, contactActivity, siteConfig, team, teamContact, user, userNotifications } from '@/drizzle/schema';
import { type Priority, type Source, type Status, activitySubTypeSchema, activityTypeSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { activityRouter } from '@/server/routers/contact/activity';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { sendEmail } from '@/utils/email';
import { stringifyPhone } from '@/utils/phone';
import { TRPCError } from '@trpc/server';
import { format, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

export const contactRouter = createTRPCRouter({
  activity: activityRouter,

  getAllContacts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.select().from(contact).orderBy(desc(contact.createdAt));
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
        companyId: contact.companyId,
        source: contact.source,
        priority: contact.priority,
        workExperience: contact.workExperience,
        currentRole: contact.currentRole,
        industry: contact.industry,
        skills: contact.skills,
        status: contact.status,
        lastContactedAt: contact.lastContactedAt,
        nextFollowUpAt: contact.nextFollowUpAt,
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
        createdBy: contact.createdBy,
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
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        companyId: z.string().nullable().optional(),
        source: z.string().optional(),
        remark: z.string().optional(),
        status: z.string().optional(),
        createdAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingContact = input.email
        ? await ctx.db
            .select()
            .from(contact)
            .where(eq(contact.email, input.email))
            .then((rows) => rows[0])
        : null;

      if (existingContact) return existingContact;

      // Ensure createdAt is set to midnight if provided
      const createdAt = input.createdAt ? startOfDay(input.createdAt) : undefined;

      const [result] = await ctx.db
        .insert(contact)
        .values({
          name: input.name ?? `${input.firstName ?? ''} ${input.lastName ?? ''}`,
          firstName: input.firstName ?? '',
          lastName: input.lastName ?? '',
          email: input.email,
          phone: stringifyPhone(input.phone ?? ''),
          company: input.company ?? '',
          companyId: input.companyId ?? null,
          source: input.source ?? 'Direct',
          status: input.status ?? 'Lead',
          remark: input.remark ?? '',
          createdBy: ctx.session?.user.id,
          ...(createdAt && { createdAt }),
        })
        .returning();

      // Log contact creation activity
      await createContactActivityHelper(ctx, {
        contactId: result.id,
        type: 'CONTACT',
        subType: 'CONTACT_CREATED',
        metadata: {
          createdType: 'natural',
          contact: result,
          source: input.source,
        },
        initiatorType: 'user',
        initiatorId: ctx.session?.user.id,
      });

      return result;
    }),

  updateContactRemark: protectedProcedure.input(z.object({ id: z.string(), remark: z.string(), oldRemark: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const thisContact = await ctx.db
      .select()
      .from(contact)
      .where(eq(contact.id, input.id))
      .then((rows) => rows[0]);

    await ctx.db.update(contact).set({ remark: input.remark }).where(eq(contact.id, input.id));

    // Log remark update activity
    await createContactActivityHelper(ctx, {
      contactId: input.id,
      type: 'ENGAGEMENT',
      subType: 'REMARK_UPDATED',
      initiatorType: 'user',
      initiatorId: ctx.session?.user.id,
      metadata: {
        contact: thisContact,
        oldRemark: input.oldRemark,
        newRemark: input.remark,
      },
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
      type: 'CONTACT',
      subType: 'CONTACT_DELETED',
      metadata: { contact: contactDetails },
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
        subType: activitySubTypeSchema,
        description: z.string(),
        initiatorType: z.enum(['user', 'contact', 'system']),
        initiatorId: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Handle attachments in metadata
      const metadata = input.metadata;

      // If metadata contains attachments, ensure it's properly formatted
      if (metadata && typeof metadata === 'object' && 'attachments' in metadata) {
        // Ensure attachments is an array
        if (!Array.isArray(metadata.attachments)) {
          metadata.attachments = [];
        }

        // Validate each attachment has required properties
        metadata.attachments = metadata.attachments.map((attachment: any) => ({
          url: attachment.url || '',
          name: attachment.name || 'Unnamed file',
          type: attachment.type || 'file',
        }));
      }

      // Insert the activity with the properly formatted metadata
      const [activity] = await ctx.db
        .insert(contactActivity)
        .values({
          contactId: input.contactId,
          userId: ctx.session?.user.id,
          type: input.type,
          subType: input.subType,
          initiatorType: input.initiatorType,
          initiatorId: input.initiatorId,
          description: input.description,
          metadata: metadata ? JSON.stringify(metadata) : null,
        })
        .returning();

      // Handle @mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = input.description.match(mentionRegex)?.map((m) => m.slice(1)) || [];

      if (mentions.length > 0) {
        // Get all mentioned users
        const mentionedUsers = await ctx.db.select().from(user).where(inArray(user.username, mentions));

        const thisContact = await ctx.db
          .select()
          .from(contact)
          .where(eq(contact.id, input.contactId))
          .then((rows) => rows[0]);

        // Create notifications for mentioned users
        for (const mentionedUser of mentionedUsers) {
          await ctx.db.insert(userNotifications).values({
            userId: mentionedUser.id,
            type: 'MESSAGE',
            subType: 'MENTIONED',
            initiatorId: ctx.session?.user.id,
            initiatorType: 'user',
            message: input.description,
            metadata: JSON.stringify({
              type: 'contacts',
              contact: thisContact,
              user: mentionedUser,
            }),
          });
        }
      }

      return activity;
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
        companyId: z.string().nullable().optional(),
        priority: z.string().optional(),
        workExperience: z.string().optional(),
        currentRole: z.string().optional(),
        industry: z.string().optional(),
        skills: z.string().optional(),
        status: z.string().optional(),
        source: z.string().optional(),
        lastContactedAt: z.date().optional().nullable(),
        nextFollowUpAt: z.date().optional().nullable(),
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
          type: 'STATUS',
          subType: 'STATUS_CHANGED',
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            contact: currentContact,
            oldStatus: currentContact.status,
            newStatus: input.status,
          },
        });
      }

      // Log priority change if priority was updated
      if (input.priority && input.priority !== currentContact.priority) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'PRIORITY',
          subType: 'PRIORITY_CHANGED',
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            contact: currentContact,
            oldPriority: currentContact.priority,
            newPriority: input.priority,
          },
        });
      }

      // Log source change if source was updated
      if (input.source && input.source !== currentContact.source) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'SOURCE',
          subType: 'SOURCE_CHANGED',
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
          metadata: {
            contact: currentContact,
            oldSource: currentContact.source,
            newSource: input.source,
          },
        });
      }

      if (input.lastContactedAt === null) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'LAST_CONTACTED_REMOVED',
          metadata: {
            contact: currentContact,
            date: currentContact.lastContactedAt,
          },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      if (input.nextFollowUpAt === null) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'NEXT_FOLLOW_UP_REMOVED',
          metadata: {
            contact: currentContact,
            date: currentContact.nextFollowUpAt,
          },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      if (input.lastContactedAt) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'LAST_CONTACTED_UPDATED',
          description: `Last contacted date updated to ${input.lastContactedAt}`,
          metadata: {
            contact: currentContact,
            oldDate: currentContact.lastContactedAt,
            newDate: input.lastContactedAt,
          },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      if (input.nextFollowUpAt) {
        await createContactActivityHelper(ctx, {
          contactId: id,
          type: 'DATE',
          subType: 'NEXT_FOLLOW_UP_UPDATED',
          metadata: {
            contact: currentContact,
            oldDate: currentContact.nextFollowUpAt,
            newDate: input.nextFollowUpAt,
          },
          initiatorType: 'user',
          initiatorId: ctx.session?.user.id,
        });
      }

      // Log general update for other field changes
      // const changedFields = Object.keys(updateData).filter((key) => updateData[key as keyof typeof updateData] !== currentContact[key as keyof typeof currentContact]);

      // if (changedFields.length > 0) {
      //   await createContactActivityHelper(ctx, {
      //     contactId: id,
      //     type: 'CONTACT',
      //     subType: 'CONTACT_UPDATED',
      //     metadata: {
      //       contact: currentContact,
      //       fields: changedFields.reduce(
      //         (acc, field) =>
      //           Object.assign(acc, {
      //             [field]: {
      //               old: currentContact[field as keyof typeof currentContact],
      //               new: updateData[field as keyof typeof updateData],
      //             },
      //           }),
      //         {} as Record<string, { old: any; new: any }>
      //       ),
      //     },
      //     initiatorType: 'user',
      //     initiatorId: ctx.session?.user.id,
      //   });
      // }

      return result;
    }),

  checkDuplicateContacts: protectedProcedure
    .input(
      z.object({
        contacts: z.array(
          z.object({
            email: z.string().optional(),
            phone: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const emails = input.contacts.map((c) => c.email).filter((e): e is string => !!e);
      const phones = input.contacts
        .map((c) => c.phone)
        .filter((p): p is string => !!p)
        .map(stringifyPhone);

      const [existingEmails, existingPhones] = await Promise.all([
        emails.length > 0 ? ctx.db.select({ email: contact.email }).from(contact).where(inArray(contact.email, emails)) : Promise.resolve([]),
        phones.length > 0 ? ctx.db.select({ phone: contact.phone }).from(contact).where(inArray(contact.phone, phones)) : Promise.resolve([]),
      ]);

      return {
        existingEmails: existingEmails.map((c) => c.email),
        existingPhones: existingPhones.map((c) => c.phone),
      };
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
        await ctx.db.insert(contactActivity).values({
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
            email: z.string().optional(),
            phone: z.string().optional(),
            company: z.string().optional(),
            companyId: z.string().nullable().optional(),
            source: z.string().optional(),
            remark: z.string().optional(),
            status: z.string().optional(),
            createdAt: z.date().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: (typeof contact.$inferSelect)[] = [];
      const errors: Array<{ email: string; error: string }> = [];

      // Get all unique emails for existence check
      const emails = [...new Set(input.contacts.map((contact) => contact.email).filter((email): email is string => typeof email === 'string' && email.length > 0))];
      const existingContacts =
        emails.length > 0
          ? await ctx.db
              .select({
                email: contact.email,
              })
              .from(contact)
              .where(inArray(contact.email, emails))
          : [];

      const existingEmails = new Set(existingContacts.map((c) => c.email));

      // Process contacts that don't exist yet
      const newContacts = input.contacts.filter((contact) => !contact.email || !existingEmails.has(contact.email));

      try {
        // Create contacts one by one, reusing createContact logic
        for (const contactData of newContacts) {
          try {
            // Ensure createdAt is set to midnight if provided
            const createdAt = contactData.createdAt ? startOfDay(contactData.createdAt) : undefined;

            const [result] = await ctx.db
              .insert(contact)
              .values({
                name: contactData.name ?? `${contactData.firstName ?? ''} ${contactData.lastName ?? ''}`,
                firstName: contactData.firstName ?? '',
                lastName: contactData.lastName ?? '',
                email: contactData.email,
                phone: stringifyPhone(contactData.phone ?? ''),
                company: contactData.company ?? '',
                companyId: contactData.companyId ?? null,
                source: contactData.source ?? 'Direct',
                status: contactData.status ?? 'Lead',
                remark: contactData.remark ?? '',
                createdBy: ctx.session?.user.id,
                ...(createdAt && { createdAt }),
              })
              .returning();

            // Log contact creation activity
            await createContactActivityHelper(ctx, {
              contactId: result.id,
              type: 'CONTACT',
              subType: 'CONTACT_CREATED',
              metadata: {
                createdType: 'natural',
                contact: result,
                source: result.source,
              },
              initiatorType: 'user',
              initiatorId: ctx.session?.user.id,
            });

            results.push(result);
          } catch (error) {
            console.error('Error creating contact:', error);
            errors.push({ email: contactData.email ?? '', error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        return {
          created: results,
          existing: existingContacts,
          errors,
        };
      } catch (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create contacts batch' });
      }
    }),

  // Optimized paginated endpoint with server-side filtering
  getContactsPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        statusFilter: z.array(z.string()).optional(),
        priorityFilter: z.array(z.string()).optional(),
        sourceFilter: z.array(z.string()).optional(),
        sortBy: z.enum(['createdAt', 'name', 'status', 'priority', 'nextFollowUpAt']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, statusFilter, priorityFilter, sourceFilter, sortBy = 'createdAt', sortOrder = 'desc' } = input;
      const offset = (page - 1) * pageSize;

      // Build dynamic where conditions
      const whereConditions = [];

      if (search) {
        const searchLower = search.toLowerCase();
        whereConditions.push(
          sql`(
            LOWER(${contact.name}) LIKE ${`%${searchLower}%`} OR
            LOWER(${contact.email}) LIKE ${`%${searchLower}%`} OR
            LOWER(${contact.company}) LIKE ${`%${searchLower}%`} OR
            ${contact.phone} LIKE ${`%${search}%`}
          )`
        );
      }

      if (statusFilter && statusFilter.length > 0) {
        whereConditions.push(inArray(contact.status, statusFilter));
      }

      if (priorityFilter && priorityFilter.length > 0) {
        whereConditions.push(inArray(contact.priority, priorityFilter));
      }

      if (sourceFilter && sourceFilter.length > 0) {
        whereConditions.push(inArray(contact.source, sourceFilter));
      }

      // Get total count
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(contact)
        .where(whereConditions.length > 0 ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}` : undefined)
        .then((rows) => rows[0]);

      const totalCount = Number(countResult.count);

      // Build order by
      const orderByColumn = {
        createdAt: contact.createdAt,
        name: contact.name,
        status: contact.status,
        priority: contact.priority,
        nextFollowUpAt: contact.nextFollowUpAt,
      }[sortBy];

      // Get paginated results
      const results = await ctx.db
        .select({
          id: contact.id,
          name: contact.name,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          status: contact.status,
          priority: contact.priority,
          source: contact.source,
          createdAt: contact.createdAt,
          nextFollowUpAt: contact.nextFollowUpAt,
          lastContactedAt: contact.lastContactedAt,
          lastActivity: contact.lastActivity,
        })
        .from(contact)
        .where(whereConditions.length > 0 ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}` : undefined)
        .orderBy(sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn))
        .limit(pageSize)
        .offset(offset);

      return {
        data: results,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    }),

  // Optimized dashboard metrics endpoint
  getDashboardMetrics: protectedProcedure
    .input(
      z.object({
        dateRange: z.enum(['this-month', 'last-month', 'last-3-months', 'last-6-months', 'this-year']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));

      // Get aggregated metrics in a single query
      const metrics = await ctx.db
        .select({
          total: sql<number>`count(*)`,
          totalThisMonth: sql<number>`count(*) filter (where ${contact.createdAt} >= ${monthStart})`,
          totalLastMonth: sql<number>`count(*) filter (where ${contact.createdAt} >= ${lastMonthStart} and ${contact.createdAt} < ${monthStart})`,
          contacted: sql<number>`count(*) filter (where ${contact.lastContactedAt} is not null)`,
          qualified: sql<number>`count(*) filter (where ${contact.status} = 'Qualified')`,
          hot: sql<number>`count(*) filter (where ${contact.priority} = 'High')`,
        })
        .from(contact)
        .then((rows) => rows[0]);

      // Calculate growth percentage
      const growth = metrics.totalLastMonth > 0 ? ((metrics.totalThisMonth - metrics.totalLastMonth) / metrics.totalLastMonth) * 100 : 0;

      // Get monthly breakdown for chart
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = i === 0 ? now : startOfMonth(subMonths(now, i - 1));

        const monthData = await ctx.db
          .select({
            count: sql<number>`count(*)`,
          })
          .from(contact)
          .where(sql`${contact.createdAt} >= ${monthStart} AND ${contact.createdAt} < ${monthEnd}`)
          .then((rows) => rows[0]);

        last6Months.push({
          month: format(monthStart, 'yyyy-MM'),
          count: Number(monthData?.count) || 0,
        });
      }

      // Get status breakdown
      const statusBreakdown = await ctx.db
        .select({
          status: contact.status,
          count: sql<number>`count(*)`,
        })
        .from(contact)
        .groupBy(contact.status);

      // Get priority breakdown
      const priorityBreakdown = await ctx.db
        .select({
          priority: contact.priority,
          count: sql<number>`count(*)`,
        })
        .from(contact)
        .groupBy(contact.priority);

      // Get source breakdown
      const sourceBreakdown = await ctx.db
        .select({
          source: contact.source,
          count: sql<number>`count(*)`,
        })
        .from(contact)
        .groupBy(contact.source);

      return {
        metrics: {
          ...metrics,
          growth: growth.toFixed(0),
        },
        monthlyData: last6Months,
        statusBreakdown,
        priorityBreakdown,
        sourceBreakdown,
      };
    }),

  // Batch load all configurations
  getAllConfigurations: protectedProcedure.query(async ({ ctx }) => {
    const configs = await ctx.db
      .select()
      .from(siteConfig)
      .where(inArray(siteConfig.key, ['status', 'priority', 'source']));

    const result = {
      statuses: [] as Status[],
      priorities: [] as Priority[],
      sources: [] as Source[],
    };

    for (const config of configs) {
      const items = config.value ? JSON.parse(config.value) : [];
      if (config.key === 'status') result.statuses = items;
      else if (config.key === 'priority') result.priorities = items;
      else if (config.key === 'source') result.sources = items;
    }

    return result;
  }),

  // Optimized kanban view endpoint
  getContactsForKanban: protectedProcedure
    .input(
      z.object({
        groupBy: z.enum(['status', 'priority', 'source']),
        search: z.string().optional(),
        limit: z.number().min(10).max(200).default(100), // Limit per column
      })
    )
    .query(async ({ ctx, input }) => {
      const { groupBy, search, limit } = input;

      // First, get the configuration for the grouping
      const configKey = groupBy === 'status' ? 'status' : groupBy === 'priority' ? 'priority' : 'source';
      const config = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, configKey))
        .then((rows) => rows[0]);

      const items = config?.value ? JSON.parse(config.value) : [];

      // Build search condition if provided
      let searchCondition = null;
      if (search) {
        const searchLower = search.toLowerCase();
        searchCondition = sql`(
          LOWER(${contact.name}) LIKE ${`%${searchLower}%`} OR
          LOWER(${contact.email}) LIKE ${`%${searchLower}%`} OR
          LOWER(${contact.company}) LIKE ${`%${searchLower}%`} OR
          ${contact.phone} LIKE ${`%${search}%`}
        )`;
      }

      // Get grouped data with limits
      const groupedData: Record<string, any[]> = {};

      for (const item of items) {
        const whereConditions = [eq(contact[groupBy], item.value)];

        if (searchCondition) {
          whereConditions.push(searchCondition);
        }

        const contacts = await ctx.db
          .select({
            id: contact.id,
            name: contact.name,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            status: contact.status,
            priority: contact.priority,
            source: contact.source,
            createdAt: contact.createdAt,
            lastContactedAt: contact.lastContactedAt,
            nextFollowUpAt: contact.nextFollowUpAt,
          })
          .from(contact)
          .where(whereConditions.length > 1 ? sql`${whereConditions[0]} AND ${whereConditions[1]}` : whereConditions[0])
          .orderBy(
            // Sort by priority first, then by created date
            sql`CASE 
              WHEN ${contact.priority} = 'High' THEN 1
              WHEN ${contact.priority} = 'Medium' THEN 2
              WHEN ${contact.priority} = 'Low' THEN 3
              ELSE 4
            END`,
            desc(contact.createdAt)
          )
          .limit(limit);

        groupedData[item.value] = contacts;
      }

      // Get total counts for each group (for display purposes)
      const counts: Record<string, number> = {};
      for (const item of items) {
        const whereConditions = [eq(contact[groupBy], item.value)];

        if (searchCondition) {
          whereConditions.push(searchCondition);
        }

        const result = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(contact)
          .where(whereConditions.length > 1 ? sql`${whereConditions[0]} AND ${whereConditions[1]}` : whereConditions[0])
          .then((rows) => rows[0]);

        counts[item.value] = Number(result.count);
      }

      return {
        columns: items.map((item: any) => ({
          id: item.value,
          title: item.value,
          color: item.color,
          items: groupedData[item.value] || [],
          totalCount: counts[item.value] || 0,
          hasMore: counts[item.value] > limit,
        })),
        config: items,
      };
    }),

  searchContacts: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(50).default(10),
        excludeIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit, excludeIds = [] } = input;

      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchLower = query.toLowerCase();

      const whereConditions = [
        sql`(
          LOWER(${contact.name}) LIKE ${`%${searchLower}%`} OR
          LOWER(${contact.email}) LIKE ${`%${searchLower}%`} OR
          LOWER(${contact.firstName}) LIKE ${`%${searchLower}%`} OR
          LOWER(${contact.lastName}) LIKE ${`%${searchLower}%`}
        )`,
      ];

      // Exclude specific IDs if provided
      if (excludeIds.length > 0) {
        whereConditions.push(
          sql`${contact.id} NOT IN (${sql.join(
            excludeIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      }

      return ctx.db
        .select({
          id: contact.id,
          name: contact.name,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          company: contact.company,
        })
        .from(contact)
        .where(sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`)
        .orderBy(contact.name)
        .limit(limit);
    }),
});
