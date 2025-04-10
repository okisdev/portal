import { contactActivity } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const activityRouter = createTRPCRouter({
  deleteNote: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const note = await ctx.db.select().from(contactActivity).where(eq(contactActivity.id, input.id));
    if (!note) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
    }

    await ctx.db.delete(contactActivity).where(eq(contactActivity.id, input.id));

    return {
      success: true,
    };
  }),
});
