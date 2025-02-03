import { contact } from '@/drizzle/schema';
import { WhatsAppError, sendWhatsAppMessage } from '@/lib/whatsapp';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod';

export const externalRouter = createTRPCRouter({
  sendWhatsAppMessage: protectedProcedure
    .input(
      z.object({
        to: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await sendWhatsAppMessage(input.to, input.message);
        return result;
      } catch (error) {
        if (error instanceof WhatsAppError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send WhatsApp message',
        });
      }
    }),

  receiveWhatsAppMessageToContactActivity: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        message: z.string(),
        messageId: z.string(),
        timestamp: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the contact by phone number
        const contactRecord = await ctx.db
          .select()
          .from(contact)
          .where(eq(contact.phone, input.from.replace(/\D/g, '')))
          .then((rows) => rows[0]);

        if (!contactRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact not found for this phone number',
          });
        }

        // Create contact activity for the received message
        await createContactActivityHelper(ctx, {
          contactId: contactRecord.id,
          type: 'ENGAGEMENT',
          subType: 'MESSAGE_RECEIVED',
          description: input.message,
          initiatorType: 'contact',
          initiatorId: contactRecord.id,
          metadata: {
            messageId: input.messageId,
            timestamp: input.timestamp,
            channel: 'whatsapp',
            message: input.message,
          },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process WhatsApp message',
        });
      }
    }),
});
