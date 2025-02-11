import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';

export const siteRouter = createTRPCRouter({
  getConfig: protectedProcedure.input(z.object({ key: z.enum(['name', 'description', 'domain']) })).query(async ({ ctx, input }) => {
    const config = await ctx.db.portal_siteConfig.findFirst({
      where: {
        key: input.key,
      },
    });

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
    return ctx.db.portal_siteConfig.findMany();
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
      const existing = await ctx.db.portal_siteConfig.findFirst({
        where: {
          key: input.key,
        },
      });

      if (existing) {
        return ctx.db.portal_siteConfig.update({
          where: {
            key: input.key,
          },
          data: {
            value: input.value,
            description: input.description,
            type: input.type,
            isPublic: input.isPublic,
            updatedAt: new Date(),
          },
        });
      }

      return ctx.db.portal_siteConfig.create({
        data: {
          key: input.key,
          value: input.value,
          description: input.description,
          type: input.type,
          isPublic: input.isPublic,
        },
      });
    }),

  deleteConfig: protectedProcedure.input(z.object({ key: z.enum(['name', 'description', 'domain']) })).mutation(async ({ ctx, input }) => {
    return ctx.db.portal_siteConfig.delete({
      where: {
        key: input.key,
      },
    });
  }),
});
