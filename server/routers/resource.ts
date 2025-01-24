import { resourceContent, resourceContentSendTrack, resourceContentShare, resourceEmails } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { and, eq, inArray, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';

const resourceContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]).optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

export type ResourceContent = z.infer<typeof resourceContentSchema>;

const resourceEmailSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]).optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

export const resourceRouter = createTRPCRouter({
  createContent: protectedProcedure.input(resourceContentSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.insert(resourceContent).values({
      ...input,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      createdBy: ctx.session.user.id,
      updatedBy: ctx.session.user.id,
    });
  }),

  getContents: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          tags: z.array(z.string()).optional(),
          visibility: z.array(z.enum(['PUBLIC', 'SHARED', 'PRIVATE'])).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      let conditions = or(
        eq(resourceContent.createdBy, userId),
        eq(resourceContent.visibility, 'PUBLIC'),
        and(eq(resourceContent.visibility, 'SHARED'), eq(resourceContentShare.sharedWithUserId, userId))
      );

      if (input?.visibility) {
        conditions = and(conditions, inArray(resourceContent.visibility, input.visibility));
      }

      if (input?.search) {
        conditions = and(conditions, or(like(resourceContent.title, `%${input.search}%`), like(resourceContent.description, `%${input.search}%`)));
      }

      if (input?.tags && input.tags.length > 0) {
        const tagConditions = input.tags.map((tag) => like(resourceContent.tags, `%${tag}%`));
        conditions = and(conditions, or(...tagConditions));
      }

      const result = await ctx.db
        .select({
          resourceContent: resourceContent,
          resourceContentShare: resourceContentShare,
          sendCount: sql<number>`count(distinct ${resourceContentSendTrack.id})`.mapWith(Number),
          lastSentAt: sql<Date | null>`max(${resourceContentSendTrack.sentAt})`.mapWith((d) => d && new Date(d)),
        })
        .from(resourceContent)
        .leftJoin(resourceContentShare, eq(resourceContent.id, resourceContentShare.resourceId))
        .leftJoin(resourceContentSendTrack, eq(resourceContent.id, resourceContentSendTrack.resourceId))
        .where(conditions)
        .groupBy(resourceContent.id, resourceContentShare.id);

      return result;
    }),

  getContent: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const result = await ctx.db
      .select()
      .from(resourceContent)
      .leftJoin(resourceContentShare, eq(resourceContent.id, resourceContentShare.resourceId))
      .where(
        and(
          eq(resourceContent.id, input),
          or(eq(resourceContent.createdBy, userId), eq(resourceContent.visibility, 'PUBLIC'), and(eq(resourceContent.visibility, 'SHARED'), eq(resourceContentShare.sharedWithUserId, userId)))
        )
      )
      .limit(1);

    return result[0];
  }),

  updateContent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: resourceContentSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select()
        .from(resourceContent)
        .leftJoin(resourceContentShare, eq(resourceContent.id, resourceContentShare.resourceId))
        .where(
          and(
            eq(resourceContent.id, input.id),
            or(eq(resourceContent.createdBy, userId), and(eq(resourceContent.visibility, 'SHARED'), eq(resourceContentShare.sharedWithUserId, userId), eq(resourceContentShare.permission, 'edit')))
          )
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error('Not authorized to edit this content');
      }

      return ctx.db
        .update(resourceContent)
        .set({
          ...input.data,
          tags: input.data.tags ? JSON.stringify(input.data.tags) : undefined,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(resourceContent.id, input.id));
    }),

  deleteContent: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.db
      .select()
      .from(resourceContent)
      .where(and(eq(resourceContent.id, input), eq(resourceContent.createdBy, userId)))
      .limit(1);

    if (!existing[0]) {
      throw new Error('Not authorized to delete this content');
    }

    return ctx.db.delete(resourceContent).where(eq(resourceContent.id, input));
  }),

  shareContent: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
        userIds: z.array(z.string()),
        permission: z.enum(['view', 'edit']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select()
        .from(resourceContent)
        .where(and(eq(resourceContent.id, input.resourceId), eq(resourceContent.createdBy, userId)))
        .limit(1);

      if (!existing[0]) {
        throw new Error('Not authorized to share this content');
      }

      if (existing[0].visibility === 'PRIVATE') {
        await ctx.db.update(resourceContent).set({ visibility: 'SHARED' }).where(eq(resourceContent.id, input.resourceId));
      }

      await ctx.db.delete(resourceContentShare).where(and(eq(resourceContentShare.resourceId, input.resourceId), inArray(resourceContentShare.sharedWithUserId, input.userIds)));

      return ctx.db.insert(resourceContentShare).values(
        input.userIds.map((userId) => ({
          resourceId: input.resourceId,
          sharedWithUserId: userId,
          permission: input.permission,
        }))
      );
    }),

  // Remove share for a user
  removeShare: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select()
        .from(resourceContent)
        .where(and(eq(resourceContent.id, input.resourceId), eq(resourceContent.createdBy, userId)))
        .limit(1);

      if (!existing[0]) {
        throw new Error('Not authorized to modify shares for this content');
      }

      return ctx.db.delete(resourceContentShare).where(and(eq(resourceContentShare.resourceId, input.resourceId), eq(resourceContentShare.sharedWithUserId, input.userId)));
    }),

  createEmail: protectedProcedure.input(resourceEmailSchema).mutation(async ({ ctx, input }) => {
    const [newEmail] = await ctx.db
      .insert(resourceEmails)
      .values({
        ...input,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        createdBy: ctx.session.user.id,
        updatedBy: ctx.session.user.id,
      })
      .returning();

    return newEmail;
  }),

  getEmails: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          tags: z.array(z.string()).optional(),
          visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      let conditions = or(eq(resourceEmails.createdBy, userId), eq(resourceEmails.visibility, 'PUBLIC'));

      if (input?.visibility) {
        conditions = and(conditions, eq(resourceEmails.visibility, input.visibility));
      }

      if (input?.search) {
        conditions = and(conditions, or(like(resourceEmails.title, `%${input.search}%`), like(resourceEmails.description, `%${input.search}%`), like(resourceEmails.subject, `%${input.search}%`)));
      }

      if (input?.tags && input.tags.length > 0) {
        const tagConditions = input.tags.map((tag) => like(resourceEmails.tags, `%${tag}%`));
        conditions = and(conditions, or(...tagConditions));
      }

      return ctx.db.select().from(resourceEmails).where(conditions);
    }),

  getEmail: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const result = await ctx.db
      .select()
      .from(resourceEmails)
      .where(and(eq(resourceEmails.id, input), or(eq(resourceEmails.createdBy, userId), eq(resourceEmails.visibility, 'PUBLIC'))))
      .limit(1);

    return result[0];
  }),

  updateEmail: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: resourceEmailSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select()
        .from(resourceEmails)
        .where(and(eq(resourceEmails.id, input.id), eq(resourceEmails.createdBy, userId)))
        .limit(1);

      if (!existing[0]) {
        throw new Error('Not authorized to edit this email template');
      }

      return ctx.db
        .update(resourceEmails)
        .set({
          ...input.data,
          tags: input.data.tags ? JSON.stringify(input.data.tags) : undefined,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(resourceEmails.id, input.id));
    }),

  deleteEmail: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.db
      .select()
      .from(resourceEmails)
      .where(and(eq(resourceEmails.id, input), eq(resourceEmails.createdBy, userId)))
      .limit(1);

    if (!existing[0]) {
      throw new Error('Not authorized to delete this email template');
    }

    return ctx.db.delete(resourceEmails).where(eq(resourceEmails.id, input));
  }),

  createContentSendTrack: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
        contactId: z.string(),
        status: z.enum(['sent', 'delivered', 'read', 'failed']),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(resourceContentSendTrack).values({
        resourceId: input.resourceId,
        contactId: input.contactId,
        sentBy: ctx.session.user.id,
        status: input.status,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
    }),
});
