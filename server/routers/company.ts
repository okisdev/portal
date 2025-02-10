import Company from '@/database/models/Company';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const companyRouter = createTRPCRouter({
  getAllCompanies: protectedProcedure.query(async ({ ctx }) => {
    const companies = await Company.find({}).lean();
    return companies.map((company) => ({
      ...company,
      id: String(company._id),
      teams: 0, // Note: Need to implement team count if needed
      contacts: 0, // Note: Need to implement contact count if needed
    }));
  }),

  getCompanyById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const company = await Company.findById(input.id).lean();
    if (!company) return null;

    return {
      ...company,
      id: String(company),
      teamCount: 0, // Note: Need to implement team count if needed
      contactCount: 0, // Note: Need to implement contact count if needed
    };
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
      const newCompany = await Company.create(input);
      return {
        ...newCompany.toObject(),
        id: newCompany._id.toString(),
      };
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
      const updatedCompany = await Company.findByIdAndUpdate(id, { ...updateData }, { new: true }).lean();

      if (!updatedCompany) throw new Error('Company not found');

      return {
        ...updatedCompany,
        id: String(updatedCompany),
      };
    }),

  deleteCompany: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await Company.findByIdAndDelete(input.id);
    return { success: true };
  }),

  updateCompanyStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['active', 'inactive']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedCompany = await Company.findByIdAndUpdate(input.id, { status: input.status }, { new: true }).lean();

      if (!updatedCompany) throw new Error('Company not found');

      return {
        ...updatedCompany,
        id: String(updatedCompany),
      };
    }),

  // Note: The following endpoints need to be implemented after Team and Contact models are created
  getCompanyTeams: protectedProcedure.input(z.object({ companyId: z.string() })).query(async ({ ctx, input }) => {
    // Implement after Team model is created
    return [];
  }),

  getCompanyContacts: protectedProcedure.input(z.object({ companyId: z.string() })).query(async ({ ctx, input }) => {
    // Implement after Contact model is created
    return [];
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
      // Implement after Contact model is created
      throw new Error('Not implemented');
    }),

  removeCompanyContact: protectedProcedure.input(z.object({ companyId: z.string(), contactId: z.string() })).mutation(async ({ ctx, input }) => {
    // Implement after Contact model is created
    throw new Error('Not implemented');
  }),
});
