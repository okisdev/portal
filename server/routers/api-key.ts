import { createHash, randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { userApiKey } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

// Regex for extracting API key prefix
const API_KEY_PREFIX_REGEX = /^(pk_\w+_)/;

// Utility function to generate API key
const generateApiKey = () => {
  const prefix = 'pk_';
  const randomPart = randomBytes(32).toString('hex');
  return `${prefix}${randomPart}`;
};

// Utility function to hash API key
const hashApiKey = (apiKey: string) => {
  return createHash('sha256').update(apiKey).digest('hex');
};

// Extract prefix from API key
const extractPrefix = (apiKey: string) => {
  const match = apiKey.match(API_KEY_PREFIX_REGEX);
  return match ? match[1] : '';
};

export const apiKeyRouter = createTRPCRouter({
  // Get all API keys for the current user
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        id: userApiKey.id,
        name: userApiKey.name,
        keyPrefix: userApiKey.keyPrefix,
        permissions: userApiKey.permissions,
        lastUsedAt: userApiKey.lastUsedAt,
        lastUsedIp: userApiKey.lastUsedIp,
        expiresAt: userApiKey.expiresAt,
        usageCount: userApiKey.usageCount,
        createdAt: userApiKey.createdAt,
      })
      .from(userApiKey)
      .where(eq(userApiKey.userId, ctx.session.user.id))
      .orderBy(desc(userApiKey.createdAt));
  }),

  // Create a new API key
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
        permissions: z.array(z.string()).default([]),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate the actual API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);
      const keyPrefix = extractPrefix(apiKey);

      // Insert into database
      const result = await ctx.db
        .insert(userApiKey)
        .values({
          id: crypto.randomUUID(),
          userId: ctx.session.user.id,
          name: input.name,
          keyHash,
          keyPrefix,
          permissions: input.permissions
            ? JSON.stringify(input.permissions)
            : null,

          expiresAt: input.expiresAt,
        })
        .returning({
          id: userApiKey.id,
          name: userApiKey.name,
          keyPrefix: userApiKey.keyPrefix,
          permissions: userApiKey.permissions,
        });

      // Return the API key only once (never stored in plain text)
      return {
        ...result[0],
        apiKey, // This is the only time the plain text key is returned
      };
    }),

  // Delete an API key
  deleteApiKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the API key belongs to the current user
      const apiKeyRecord = await ctx.db
        .select()
        .from(userApiKey)
        .where(
          and(
            eq(userApiKey.id, input.id),
            eq(userApiKey.userId, ctx.session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!apiKeyRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        });
      }

      // Delete the API key
      return ctx.db.delete(userApiKey).where(eq(userApiKey.id, input.id));
    }),
});
