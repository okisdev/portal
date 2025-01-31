import { company, companyContact, contact, team, teamContact } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export const companyRouter = createTRPCRouter({
  getAllCompanies: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: company.id,
        name: company.name,
        description: company.description,
        industry: company.industry,
        size: company.size,
        website: company.website,
        email: company.email,
        phone: company.phone,
        status: company.status,
        createdAt: company.createdAt,
        teams: sql<number>`(SELECT COUNT(*) FROM ${team} WHERE ${team.companyId} = ${company.id})`,
        contacts: sql<number>`(SELECT COUNT(*) FROM ${companyContact} WHERE ${companyContact.companyId} = ${company.id})`,
      })
      .from(company)
      .leftJoin(companyContact, eq(companyContact.companyId, company.id))
      .groupBy(company.id, company.name, company.description, company.industry, company.size, company.website, company.email, company.phone, company.status, company.createdAt);
  }),

  getCompanyById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select({
        id: company.id,
        name: company.name,
        description: company.description,
        industry: company.industry,
        size: company.size,
        website: company.website,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        postalCode: company.postalCode,
        phone: company.phone,
        email: company.email,
        status: company.status,
        metadata: company.metadata,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        teamCount: sql<number>`(SELECT COUNT(*) FROM ${team} WHERE ${team.companyId} = ${company.id})`,
        contactCount: sql<number>`(SELECT COUNT(*) FROM ${companyContact} WHERE ${companyContact.companyId} = ${company.id})`,
      })
      .from(company)
      .where(eq(company.id, input.id))
      .then((rows) => rows[0]);

    return result;
  }),

  createCompany: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        status: z.enum(['active', 'inactive']).default('active'),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newCompany] = await ctx.db
        .insert(company)
        .values({
          name: input.name,
          description: input.description,
          industry: input.industry,
          size: input.size,
          website: input.website,
          address: input.address,
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          phone: input.phone,
          email: input.email,
          status: input.status,
          metadata: input.metadata,
        })
        .returning();

      return newCompany;
    }),

  updateCompany: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
        website: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        status: z.enum(['active', 'inactive']).optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const [updatedCompany] = await ctx.db
        .update(company)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(company.id, id))
        .returning();

      return updatedCompany;
    }),

  deleteCompany: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.delete(company).where(eq(company.id, input.id));
  }),

  getCompanyTeams: protectedProcedure.input(z.object({ companyId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        contacts: sql<number>`(SELECT COUNT(*) FROM ${teamContact} WHERE ${teamContact.teamId} = ${team.id})`,
      })
      .from(team)
      .leftJoin(teamContact, eq(teamContact.teamId, team.id))
      .where(eq(team.companyId, input.companyId));
  }),

  updateCompanyStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['active', 'inactive']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedCompany] = await ctx.db
        .update(company)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(company.id, input.id))
        .returning();

      return updatedCompany;
    }),

  getCompanyContacts: protectedProcedure.input(z.object({ companyId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        id: sql<string>`${companyContact.id}::text`,
        contact: {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          status: contact.status,
          jobTitle: contact.jobTitle,
          department: companyContact.department,
          role: companyContact.role,
          startDate: companyContact.startDate,
          endDate: companyContact.endDate,
          isActive: companyContact.isActive,
        },
      })
      .from(companyContact)
      .innerJoin(contact, eq(companyContact.contactId, contact.id))
      .where(eq(companyContact.companyId, input.companyId));
  }),

  addCompanyContact: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        contactId: z.string(),
        role: z.enum(['employee', 'manager', 'executive', 'other']).optional(),
        department: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newCompanyContact] = await ctx.db
        .insert(companyContact)
        .values({
          companyId: input.companyId,
          contactId: input.contactId,
          role: input.role,
          department: input.department,
        })
        .returning();

      return newCompanyContact;
    }),

  removeCompanyContact: protectedProcedure.input(z.object({ companyId: z.string(), contactId: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(companyContact).where(sql`${companyContact.companyId} = ${input.companyId} AND ${companyContact.contactId} = ${input.contactId}`);
  }),
});
