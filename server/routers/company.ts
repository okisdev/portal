import { company, team } from '@/drizzle/schema';
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
      })
      .from(company);
  }),

  getCompanyById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select()
      .from(company)
      .where(eq(company.id, input.id))
      .then((rows) => rows[0]);
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
        contacts: sql<number>`(SELECT COUNT(*) FROM team_contact WHERE team_contact.team_id = ${team.id})`,
      })
      .from(team)
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
});
