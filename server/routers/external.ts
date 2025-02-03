import { WhatsAppError, sendWhatsAppMessage } from '@/lib/whatsapp';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
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
});
