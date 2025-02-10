import { SiteConfig } from '@/database/models/siteConfig';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const siteRouter = createTRPCRouter({
  getConfig: protectedProcedure.input(z.object({ key: z.enum(['name', 'description', 'domain']) })).query(async ({ ctx, input }) => {
    const config = await SiteConfig.findOne({ key: input.key });

    if (!config) {
      return {
        id: crypto.randomUUID(),
        key: input.key,
        value: input.key === 'name' ? 'My Site' : '',
        description: null,
        type: 'string',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return config;
  }),

  getAllConfig: protectedProcedure.query(async ({ ctx }) => {
    return SiteConfig.find();
  }),

  updateConfig: protectedProcedure
    .input(
      z.object({
        key: z.enum(['name', 'description', 'domain']),
        value: z.string(),
        description: z.string().optional(),
        type: z.enum(['string', 'number', 'boolean', 'json', 'array']).default('string'),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await SiteConfig.findOne({ key: input.key });

      if (existing) {
        return SiteConfig.updateOne(
          { key: input.key },
          {
            value: input.value,
            description: input.description,
            type: input.type,
            isPublic: input.isPublic,
            updatedAt: new Date(),
          }
        );
      }

      return SiteConfig.create({
        key: input.key,
        value: input.value,
        description: input.description,
        type: input.type,
        isPublic: input.isPublic,
      });
    }),

  deleteConfig: protectedProcedure.input(z.object({ key: z.enum(['name', 'description', 'domain']) })).mutation(async ({ ctx, input }) => {
    return SiteConfig.deleteOne({ key: input.key });
  }),
});
