import { contact, contactActivity, team, teamContact, user, userNotifications } from '@/drizzle/schema';
import { activitySubTypeSchema, activityTypeSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { activityRouter } from '@/server/routers/contact/activity';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { sendEmail } from '@/utils/email';
import { stringifyPhone } from '@/utils/phone';
import { TRPCError } from '@trpc/server';
import { startOfDay } from 'date-fns';
import { asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

export const contactRouter = createTRPCRouter({
  activity: activityRouter,

  getAllContacts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(contact).orderBy(desc(contact.createdAt));
  }),

  getAllContactsCount: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({ count: count() })
      .from(contact)
      .then((rows) => rows[0]);
  }),

  getContactsByPagination: protectedProcedure.input(z.object({ page: z.number(), limit: z.number() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select()
      .from(contact)
      .orderBy(desc(contact.createdAt))
      .offset(input.page * input.limit)
      .limit(input.limit);
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
        return await ctx.db.select().from(contact).orderBy(desc(contact.createdAt)).limit(input.limit);
      }

      return await ctx.db
        .select()
        .from(contact)
        .where(
          sql`${contact.firstName} ILIKE ${`%${input.query}%`} OR 
            ${contact.lastName} ILIKE ${`%${input.query}%`} OR 
            ${contact.email} ILIKE ${`%${input.query}%`} OR
            ${contact.phone} ILIKE ${`%${input.query}%`}`
        )
        .limit(input.limit);
    }),

  getContactById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
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

    return await ctx.db.delete(contact).where(eq(contact.id, input.id));
  }),

  getContactActivities: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.select().from(contactActivity).where(eq(contactActivity.contactId, input.id)).orderBy(asc(contactActivity.createdAt));
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

  deleteContactActivity: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.delete(contactActivity).where(eq(contactActivity.id, input.id));
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
});
