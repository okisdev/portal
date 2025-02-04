import { contact } from '@/drizzle/schema';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { createContactActivityHelper } from '@/server/helper/contact';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { formatPhoneNumber, normalizePhoneNumber } from '@/utils/number';
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
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: JSON.stringify(error),
        });
      }
    }),

  handleWhatsAppMessageStatus: publicProcedure
    .input(
      z.object({
        messageId: z.string(),
        status: z.string(),
        timestamp: z.number(),
        recipientId: z.string(),
        conversationId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const contactRecord = await ctx.db
          .select()
          .from(contact)
          .where(eq(contact.phone, normalizePhoneNumber(input.recipientId)))
          .then((rows) => rows[0]);

        if (!contactRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact not found for this phone number',
          });
        }

        await createContactActivityHelper(ctx, {
          contactId: contactRecord.id,
          type: 'ENGAGEMENT',
          subType: 'MESSAGE_SENT',
          description: `WhatsApp message ${input.status}`,
          initiatorType: 'system',
          initiatorId: 'whatsapp',
          metadata: {
            messageId: input.messageId,
            status: input.status,
            timestamp: input.timestamp,
            conversationId: input.conversationId,
            channel: 'whatsapp',
            ...input.metadata,
          },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process WhatsApp message status',
        });
      }
    }),

  receiveWhatsAppMessageToContactActivity: publicProcedure
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
        const contactRecord = await ctx.db
          .select()
          .from(contact)
          .where(eq(contact.phone, formatPhoneNumber(input.from)))
          .then((rows) => rows[0]);

        if (!contactRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact not found for this phone number',
          });
        }

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
