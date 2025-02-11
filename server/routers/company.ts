import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const companyRouter = createTRPCRouter({
  getAllCompanies: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.portal_company.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        size: true,
        website: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            teams: true,
            contacts: true,
          },
        },
      },
    });
  }),

  getCompanyById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.portal_company.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        size: true,
        website: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            teams: true,
            contacts: true,
          },
        },
      },
    });
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
      return await ctx.db.portal_company.create({
        data: {
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
        },
      });
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
      return await ctx.db.portal_company.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
    }),

  deleteCompany: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.portal_company.delete({
      where: { id: input.id },
    });
  }),

  getCompanyTeams: protectedProcedure.input(z.object({ companyId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.portal_team.findMany({
      where: { companyId: input.companyId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });
  }),

  updateCompanyStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['active', 'inactive']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.portal_company.update({
        where: { id: input.id },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
      });
    }),

  getCompanyContacts: protectedProcedure.input(z.object({ companyId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db.portal_company_contact.findMany({
      where: { companyId: input.companyId },
      select: {
        id: true,
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            jobTitle: true,
          },
        },
        department: true,
        role: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });
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
      return await ctx.db.portal_company_contact.create({
        data: {
          companyId: input.companyId,
          contactId: input.contactId,
          role: input.role,
          department: input.department,
        },
      });
    }),

  removeCompanyContact: protectedProcedure.input(z.object({ companyId: z.string(), contactId: z.string() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.portal_company_contact.deleteMany({
      where: {
        companyId: input.companyId,
        contactId: input.contactId,
      },
    });
  }),
});
