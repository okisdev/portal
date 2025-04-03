import { siteConfig } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const siteRouter = createTRPCRouter({
  getConfig: protectedProcedure.input(z.object({ key: z.enum(['name', 'description', 'domain', 'supportEmailDomains', 'status', 'priority', 'source']) })).query(async ({ ctx, input }) => {
    const config = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, input.key))
      .then((rows) => rows[0]);

    if (!config) {
      return {
        id: crypto.randomUUID(),
        key: input.key,
        value:
          input.key === 'name'
            ? 'My Site'
            : input.key === 'status'
              ? JSON.stringify(['lead', 'appointment', 'follow_up', 'called', 'called_no_answer', 'after_pitching', 'key_person', 'special', 'trial', 'final', 'closed', 'junk'])
              : input.key === 'priority'
                ? JSON.stringify(['urgent', 'high', 'medium', 'low'])
                : input.key === 'source'
                  ? JSON.stringify(['Pitching', 'Referral', 'Website', 'Email', 'Instagram', 'LinkedIn', 'WhatsApp', 'Facebook', 'BNI', 'No Planner', 'Pay Trial', 'Other'])
                  : '',
        description: null,
        type: input.key === 'status' || input.key === 'priority' || input.key === 'source' ? 'array' : 'string',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return config;
  }),

  getAllConfig: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(siteConfig);
  }),

  updateConfig: protectedProcedure
    .input(
      z.object({
        key: z.enum(['name', 'description', 'domain', 'supportEmailDomains', 'status', 'priority', 'source']),
        value: z.string(),
        description: z.string().optional(),
        type: z.enum(['string', 'number', 'boolean', 'json', 'array']).default('string'),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, input.key))
        .then((rows) => rows[0]);

      if (existing) {
        return ctx.db
          .update(siteConfig)
          .set({
            value: input.value,
            description: input.description,
            type: input.type,
            isPublic: input.isPublic,
            updatedAt: new Date(),
          })
          .where(eq(siteConfig.key, input.key))
          .returning();
      }

      return ctx.db
        .insert(siteConfig)
        .values({
          key: input.key,
          value: input.value,
          description: input.description,
          type: input.type,
          isPublic: input.isPublic,
        })
        .returning();
    }),

  deleteConfig: protectedProcedure.input(z.object({ key: z.enum(['name', 'description', 'domain', 'supportEmailDomains', 'status', 'priority', 'source']) })).mutation(async ({ ctx, input }) => {
    return ctx.db.delete(siteConfig).where(eq(siteConfig.key, input.key));
  }),
});
