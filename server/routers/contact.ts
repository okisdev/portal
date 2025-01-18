import { contact, contactActivity, team, teamContact } from '@/drizzle/schema';
import { prioritySchema, statusSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

export const contactRouter = createTRPCRouter({
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
        source: contact.source,
        priority: contact.priority,
        workExperience: contact.workExperience,
        currentRole: contact.currentRole,
        industry: contact.industry,
        skills: contact.skills,
        status: contact.status,
        lastContactedAt: contact.lastContactedAt,
        notes: contact.notes,
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
        notes: z.string().optional(),
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
          notes: input.notes ?? '',
        })
        .returning();

      return result[0];
    }),

  deleteContact: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    return ctx.db.delete(contact).where(eq(contact.id, input.id));
  }),

  getContactActivities: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return ctx.db.select().from(contactActivity).where(eq(contactActivity.contactId, input.id)).orderBy(desc(contactActivity.createdAt));
  }),

  createContactActivity: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        type: z.string(),
        title: z.string(),
        description: z.string(),
        initiatorType: z.enum(['user', 'contact', 'system']),
        initiatorId: z.string(),
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
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const name = `${input.firstName} ${input.lastName}`;
      return await ctx.db
        .update(contact)
        .set({ ...updateData, name })
        .where(eq(contact.id, id));
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
});
