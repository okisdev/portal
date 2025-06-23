import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { contactActivity } from '@/drizzle/schema';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const activityRouter = createTRPCRouter({
  replyNote: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string(),
        contactId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db
        .select()
        .from(contactActivity)
        .where(eq(contactActivity.id, input.id));

      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
      }

      await createContactActivityHelper(ctx, {
        contactId: note[0].contactId,
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

  deleteNote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db
        .select()
        .from(contactActivity)
        .where(eq(contactActivity.id, input.id));
      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
      }

      await ctx.db
        .delete(contactActivity)
        .where(eq(contactActivity.id, input.id));

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
      const note = await ctx.db
        .select()
        .from(contactActivity)
        .where(eq(contactActivity.id, input.id));
      if (!note || note.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
      }

      await ctx.db
        .update(contactActivity)
        .set({
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(contactActivity.id, input.id));

      return {
        success: true,
      };
    }),
});
