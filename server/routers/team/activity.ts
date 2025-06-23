import { teamActivity } from '@/drizzle/schema';
import { createTeamActivityHelper } from '@/server/helper/team';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

export const activityRouter = createTRPCRouter({
  replyNote: protectedProcedure.input(z.object({ id: z.string(), description: z.string() })).mutation(async ({ ctx, input }) => {
    const note = await ctx.db.select().from(teamActivity).where(eq(teamActivity.id, input.id));

    if (!note) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
    }

    await createTeamActivityHelper(ctx, {
      teamId: note[0].teamId,
      type: 'ENGAGEMENT',
      subType: 'NOTE_ADDED',
      description: input.description,
      initiatorType: 'user',
      initiatorId: ctx.session.user.id,
      metadata: { replyTo: note[0].id },
    });

    return {
      success: true,
    };
  }),

  deleteNote: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const note = await ctx.db.select().from(teamActivity).where(eq(teamActivity.id, input.id));
    if (!note) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
    }

    await ctx.db.delete(teamActivity).where(eq(teamActivity.id, input.id));

    return {
      success: true,
    };
  }),

  updateNote: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.select().from(teamActivity).where(eq(teamActivity.id, input.id));
      if (!note || note.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
      }

      await ctx.db
        .update(teamActivity)
        .set({
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(teamActivity.id, input.id));

      return {
        success: true,
      };
    }),
});
