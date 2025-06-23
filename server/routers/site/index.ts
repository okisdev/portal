import { siteConfig } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

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
        value: input.key === 'name' ? 'My Site' : '',
        description: null,
        type: input.key === 'status' || input.key === 'priority' || input.key === 'source' ? 'array' : 'string',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return config;
  }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'status'))
      .then((rows) => rows[0]);

    return JSON.parse(response?.value || '[]');
  }),

  addStatus: protectedProcedure.input(z.object({ value: z.string(), color: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'status'))
      .then((rows) => rows[0]);

    if (existing) {
      const values = JSON.parse(existing.value);
      if (values.some((v: { value: string }) => v.value === input.value)) {
        throw new Error('Status already exists');
      }
      values.push({ value: input.value, color: input.color });
      return ctx.db
        .update(siteConfig)
        .set({ value: JSON.stringify(values), updatedAt: new Date() })
        .where(eq(siteConfig.key, 'status'))
        .returning();
    }

    return ctx.db
      .insert(siteConfig)
      .values({
        key: 'status',
        value: JSON.stringify([{ value: input.value, color: input.color }]),
        type: 'array',
        isPublic: true,
      })
      .returning();
  }),

  removeStatus: protectedProcedure.input(z.object({ value: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'status'))
      .then((rows) => rows[0]);

    if (existing) {
      const values = JSON.parse(existing.value);
      const filteredValues = values.filter((v: { value: string }) => v.value !== input.value);
      return ctx.db
        .update(siteConfig)
        .set({ value: JSON.stringify(filteredValues), updatedAt: new Date() })
        .where(eq(siteConfig.key, 'status'))
        .returning();
    }
  }),

  getPriority: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'priority'))
      .then((rows) => rows[0]);

    return JSON.parse(response?.value || '[]');
  }),

  addPriority: protectedProcedure.input(z.object({ value: z.string(), color: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'priority'))
      .then((rows) => rows[0]);

    if (existing) {
      const values = JSON.parse(existing.value);
      if (values.some((v: { value: string }) => v.value === input.value)) {
        throw new Error('Priority already exists');
      }
      values.push({ value: input.value, color: input.color });
      return ctx.db
        .update(siteConfig)
        .set({ value: JSON.stringify(values), updatedAt: new Date() })
        .where(eq(siteConfig.key, 'priority'))
        .returning();
    }

    return ctx.db
      .insert(siteConfig)
      .values({
        key: 'priority',
        value: JSON.stringify([{ value: input.value, color: input.color }]),
        type: 'array',
        isPublic: true,
      })
      .returning();
  }),

  removePriority: protectedProcedure.input(z.object({ value: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'priority'))
      .then((rows) => rows[0]);

    if (existing) {
      const values = JSON.parse(existing.value);
      const filteredValues = values.filter((v: { value: string }) => v.value !== input.value);
      return ctx.db
        .update(siteConfig)
        .set({ value: JSON.stringify(filteredValues), updatedAt: new Date() })
        .where(eq(siteConfig.key, 'priority'))
        .returning();
    }
  }),

  getSource: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'source'))
      .then((rows) => rows[0]);

    return JSON.parse(response?.value || '[]');
  }),

  addSource: protectedProcedure.input(z.object({ value: z.string(), color: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'source'))
      .then((rows) => rows[0]);

    if (existing) {
      const values = JSON.parse(existing.value);
      if (values.some((v: { value: string }) => v.value === input.value)) {
        throw new Error('Source already exists');
      }
      values.push({ value: input.value, color: input.color });
      return ctx.db
        .update(siteConfig)
        .set({ value: JSON.stringify(values), updatedAt: new Date() })
        .where(eq(siteConfig.key, 'source'))
        .returning();
    }

    return ctx.db
      .insert(siteConfig)
      .values({
        key: 'source',
        value: JSON.stringify([{ value: input.value, color: input.color }]),
        type: 'array',
        isPublic: true,
      })
      .returning();
  }),

  removeSource: protectedProcedure.input(z.object({ value: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, 'source'))
      .then((rows) => rows[0]);

    if (existing) {
      const values = JSON.parse(existing.value);
      const filteredValues = values.filter((v: { value: string }) => v.value !== input.value);
      return ctx.db
        .update(siteConfig)
        .set({ value: JSON.stringify(filteredValues), updatedAt: new Date() })
        .where(eq(siteConfig.key, 'source'))
        .returning();
    }
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

  updateStatus: protectedProcedure
    .input(
      z.object({
        oldValue: z.string(),
        newValue: z.string(),
        color: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'status'))
        .then((rows) => rows[0]);

      if (existing) {
        const values = JSON.parse(existing.value);
        const index = values.findIndex((v: { value: string }) => v.value === input.oldValue);
        if (index === -1) {
          throw new Error('Status not found');
        }
        values[index] = { value: input.newValue, color: input.color };
        return ctx.db
          .update(siteConfig)
          .set({ value: JSON.stringify(values), updatedAt: new Date() })
          .where(eq(siteConfig.key, 'status'))
          .returning();
      }
    }),

  reorderStatus: protectedProcedure
    .input(
      z.object({
        values: z.array(z.object({ value: z.string(), color: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'status'))
        .then((rows) => rows[0]);

      if (existing) {
        return ctx.db
          .update(siteConfig)
          .set({ value: JSON.stringify(input.values), updatedAt: new Date() })
          .where(eq(siteConfig.key, 'status'))
          .returning();
      }
    }),

  updatePriority: protectedProcedure
    .input(
      z.object({
        oldValue: z.string(),
        newValue: z.string(),
        color: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'priority'))
        .then((rows) => rows[0]);

      if (existing) {
        const values = JSON.parse(existing.value);
        const index = values.findIndex((v: { value: string }) => v.value === input.oldValue);
        if (index === -1) {
          throw new Error('Priority not found');
        }
        values[index] = { value: input.newValue, color: input.color };
        return ctx.db
          .update(siteConfig)
          .set({ value: JSON.stringify(values), updatedAt: new Date() })
          .where(eq(siteConfig.key, 'priority'))
          .returning();
      }
    }),

  reorderPriority: protectedProcedure
    .input(
      z.object({
        values: z.array(z.object({ value: z.string(), color: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'priority'))
        .then((rows) => rows[0]);

      if (existing) {
        return ctx.db
          .update(siteConfig)
          .set({ value: JSON.stringify(input.values), updatedAt: new Date() })
          .where(eq(siteConfig.key, 'priority'))
          .returning();
      }
    }),

  updateSource: protectedProcedure
    .input(
      z.object({
        oldValue: z.string(),
        newValue: z.string(),
        color: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'source'))
        .then((rows) => rows[0]);

      if (existing) {
        const values = JSON.parse(existing.value);
        const index = values.findIndex((v: { value: string }) => v.value === input.oldValue);
        if (index === -1) {
          throw new Error('Source not found');
        }
        values[index] = { value: input.newValue, color: input.color };
        return ctx.db
          .update(siteConfig)
          .set({ value: JSON.stringify(values), updatedAt: new Date() })
          .where(eq(siteConfig.key, 'source'))
          .returning();
      }
    }),

  reorderSource: protectedProcedure
    .input(
      z.object({
        values: z.array(z.object({ value: z.string(), color: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, 'source'))
        .then((rows) => rows[0]);

      if (existing) {
        return ctx.db
          .update(siteConfig)
          .set({ value: JSON.stringify(input.values), updatedAt: new Date() })
          .where(eq(siteConfig.key, 'source'))
          .returning();
      }
    }),
});
