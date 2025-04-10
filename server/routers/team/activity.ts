import { teamActivity } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const activityRouter = createTRPCRouter({
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
