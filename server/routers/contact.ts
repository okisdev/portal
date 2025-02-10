import { Contact } from '@/database/models/contact';
import { prioritySchema, statusSchema } from '@/lib/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { sendEmail } from '@/utils/email';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const contactRouter = createTRPCRouter({
  getAllContacts: protectedProcedure.query(async ({ ctx }) => {
    return Contact.find().sort({ createdAt: -1 });
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
        return Contact.find().sort({ createdAt: -1 }).limit(input.limit);
      }

      return Contact.find({
        $or: [
          { firstName: { $regex: input.query, $options: 'i' } },
          { lastName: { $regex: input.query, $options: 'i' } },
          { email: { $regex: input.query, $options: 'i' } },
          { phone: { $regex: input.query, $options: 'i' } },
        ],
      }).limit(input.limit);
    }),

  getContactById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const contactData = await Contact.findById(input.id).populate('companyId').populate('assignedTo').lean();

    if (!contactData) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
    }

    return contactData;
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
      const existingContact = await Contact.findOne({ email: input.email });

      if (existingContact) return existingContact;

      // If campaignCode is an email, treat it as a referral
      let referralContact = null;
      if (typeof input.campaignCode === 'string' && input.campaignCode.includes('@')) {
        referralContact = await Contact.findOne({ email: input.campaignCode });
      }

      const newContact = new Contact({
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

      const result = await newContact.save();

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

      return result;
    }),

  updateContactRemark: protectedProcedure.input(z.object({ id: z.string(), remark: z.string(), oldRemark: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const result = await Contact.findByIdAndUpdate(input.id, { remark: input.remark }, { new: true });

    if (!result) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
    }

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

    return result;
  }),

  deleteContact: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const contactDetails = await Contact.findById(input.id);

    if (!contactDetails) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
    }

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

    return Contact.findByIdAndDelete(input.id);
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
      const currentContact = await Contact.findById(id);

      if (!currentContact) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
      }

      // Only update name if firstName or lastName is provided
      const firstName = input.firstName ?? currentContact.firstName;
      const lastName = input.lastName ?? currentContact.lastName;
      const name = `${firstName} ${lastName}`.trim();

      const result = await Contact.findByIdAndUpdate(id, { ...updateData, name }, { new: true });

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
        await createContactActivityHelper(ctx, {
          contactId: input.contactId,
          type: 'ENGAGEMENT',
          subType: 'EMAIL_SENT',
          description: `Email sent to ${input.to} with subject: ${input.subject}`,
          initiatorType: 'user',
          initiatorId: ctx.session.user.id,
          metadata: {
            to: input.to,
            subject: input.subject,
            content: input.content,
            cc: input.cc,
            bcc: input.bcc,
            attachments: input.attachments,
          },
        });

        return {
          success: true,
        };
      } catch (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send email' });
      }
    }),
});
