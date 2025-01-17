import { contact, team, teamContact, teamMember, user } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, eq, exists } from 'drizzle-orm';
import { z } from 'zod';

export const teamRouter = createTRPCRouter({
  getAllTeams: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(team);
  }),

  getContactTeams: protectedProcedure.input(z.object({ contactId: z.string() })).query(({ ctx, input }) => {
    return ctx.db
      .select()
      .from(team)
      .where(
        exists(
          ctx.db
            .select()
            .from(teamContact)
            .where(and(eq(teamContact.teamId, team.id), eq(teamContact.contactId, input.contactId)))
        )
      );
  }),

  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newTeam] = await ctx.db
        .insert(team)
        .values({
          name: input.name,
          description: input.description,
          createdBy: ctx.session.user.id,
        })
        .returning();

      await ctx.db.insert(teamMember).values({
        teamId: newTeam.id,
        userId: ctx.session.user.id,
        role: 'admin',
      });

      return newTeam;
    }),

  assignContactToTeam: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        teamId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(teamContact)
        .where(and(eq(teamContact.teamId, input.teamId), eq(teamContact.contactId, input.contactId)))
        .then((rows) => rows[0]);

      if (existing) return existing;

      const [result] = await ctx.db
        .insert(teamContact)
        .values({
          teamId: input.teamId,
          contactId: input.contactId,
        })
        .returning();

      return result;
    }),

  getTeamById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select()
      .from(team)
      .where(eq(team.id, input.id))
      .then((rows) => rows[0]);
  }),

  getTeamContacts: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        id: contact.id,
        name: contact.name,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        status: contact.status,
        createdAt: contact.createdAt,
      })
      .from(contact)
      .innerJoin(teamContact, eq(teamContact.contactId, contact.id))
      .where(eq(teamContact.teamId, input.teamId));
  }),

  getTeamMembers: protectedProcedure.input(z.object({ teamId: z.string() })).query(async ({ ctx, input }) => {
    return await ctx.db
      .select({
        id: teamMember.id,
        role: teamMember.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(teamMember)
      .innerJoin(user, eq(user.id, teamMember.userId))
      .where(eq(teamMember.teamId, input.teamId));
  }),
});
