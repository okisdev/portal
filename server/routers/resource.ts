import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const resourceContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  tags: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

export type ResourceContent = z.infer<typeof resourceContentSchema>;

const resourceEmailSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  content: z.string().min(1),
  tags: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

export const resourceRouter = createTRPCRouter({
  createContent: protectedProcedure.input(resourceContentSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.portal_resourceContent.create({
      data: {
        ...input,
        createdBy: ctx.session.user.id,
        updatedBy: ctx.session.user.id,
      },
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

      const where = {
        OR: [
          { createdBy: userId },
          { visibility: 'PUBLIC' },
          {
            AND: [
              { visibility: 'SHARED' },
              {
                portal_resourceContentShare: {
                  some: {
                    sharedWithUserId: userId,
                  },
                },
              },
            ],
          },
        ],
      };

      if (input?.visibility) {
        where.visibility = { in: input.visibility };
      }

      if (input?.search) {
        where.OR = [{ title: { contains: input.search } }, { description: { contains: input.search } }];
      }

      if (input?.tags && input.tags.length > 0) {
        where.OR = input.tags.map((tag) => ({
          tags: { contains: tag },
        }));
      }

      const result = await ctx.db.portal_resourceContent.findMany({
        include: {
          portal_resourceContentShare: true,
          portal_resourceContentSendTrack: {
            include: {
              contact: true,
            },
          },
        },
        where,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return result.map((content) => ({
        resourceContent: content,
        resourceContentShare: content.portal_resourceContentShare,
        sendCount: content.portal_resourceContentSendTrack.length,
        lastSentAt:
          content.portal_resourceContentSendTrack.length > 0
            ? content.portal_resourceContentSendTrack.reduce((max, track) => (track.sentAt > max ? track.sentAt : max), content.portal_resourceContentSendTrack[0].sentAt)
            : null,
        recipients: content.portal_resourceContentSendTrack
          .map((track) => track.contact)
          .filter(Boolean)
          .map((contact) => ({
            id: contact.id,
            name: contact.name,
            email: contact.email,
          })),
      }));
    }),

  getContent: protectedProcedure.input(z.object({ id: z.string(), includeShare: z.boolean().optional() })).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    return ctx.db.portal_resourceContent.findFirst({
      include: {
        portal_resourceContentShare: true,
      },
      where: {
        id: input.id,
        OR: [
          { createdBy: userId },
          { visibility: 'PUBLIC' },
          {
            AND: [
              { visibility: 'SHARED' },
              {
                portal_resourceContentShare: {
                  some: {
                    sharedWithUserId: userId,
                  },
                },
              },
            ],
          },
        ],
      },
    });
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

      const existing = await ctx.db.portal_resourceContent.findFirst({
        include: {
          portal_resourceContentShare: true,
        },
        where: {
          id: input.id,
          OR: [
            { createdBy: userId },
            {
              AND: [
                { visibility: 'SHARED' },
                {
                  portal_resourceContentShare: {
                    some: {
                      sharedWithUserId: userId,
                      permission: 'edit',
                    },
                  },
                },
              ],
            },
          ],
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to edit this content' });
      }

      return ctx.db.portal_resourceContent.update({
        where: { id: input.id },
        data: {
          ...input.data,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });
    }),

  deleteContent: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.db.portal_resourceContent.findFirst({
      where: {
        id: input,
        createdBy: userId,
      },
    });

    if (!existing) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to delete this content' });
    }

    return ctx.db.portal_resourceContent.delete({
      where: { id: input },
    });
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

      const existing = await ctx.db.portal_resourceContent.findFirst({
        where: {
          id: input.resourceId,
          createdBy: userId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to share this content' });
      }

      if (existing.visibility === 'PRIVATE') {
        await ctx.db.portal_resourceContent.update({
          where: { id: input.resourceId },
          data: { visibility: 'SHARED' },
        });
      }

      await ctx.db.portal_resourceContentShare.deleteMany({
        where: {
          resourceId: input.resourceId,
          sharedWithUserId: { in: input.userIds },
        },
      });

      return ctx.db.portal_resourceContentShare.createMany({
        data: input.userIds.map((userId) => ({
          resourceId: input.resourceId,
          sharedWithUserId: userId,
          permission: input.permission,
        })),
      });
    }),

  removeShare: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.portal_resourceContent.findFirst({
        where: {
          id: input.resourceId,
          createdBy: userId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to modify shares for this content' });
      }

      return ctx.db.portal_resourceContentShare.delete({
        where: {
          resourceId_sharedWithUserId: {
            resourceId: input.resourceId,
            sharedWithUserId: input.userId,
          },
        },
      });
    }),

  createEmail: protectedProcedure.input(resourceEmailSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.portal_resourceEmails.create({
      data: {
        ...input,
        createdBy: ctx.session.user.id,
        updatedBy: ctx.session.user.id,
      },
    });
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
      const where = {
        OR: [{ createdBy: userId }, { visibility: 'PUBLIC' }],
      };

      if (input?.visibility) {
        where.visibility = input.visibility;
      }

      if (input?.search) {
        where.OR = [{ title: { contains: input.search } }, { description: { contains: input.search } }, { subject: { contains: input.search } }];
      }

      if (input?.tags && input.tags.length > 0) {
        where.OR = input.tags.map((tag) => ({
          tags: { contains: tag },
        }));
      }

      return ctx.db.portal_resourceEmails.findMany({ where });
    }),

  getEmail: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    return ctx.db.portal_resourceEmails.findFirst({
      where: {
        id: input,
        OR: [{ createdBy: userId }, { visibility: 'PUBLIC' }],
      },
    });
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

      const existing = await ctx.db.portal_resourceEmails.findFirst({
        where: {
          id: input.id,
          createdBy: userId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to edit this email template' });
      }

      return ctx.db.portal_resourceEmails.update({
        where: { id: input.id },
        data: {
          ...input.data,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });
    }),

  deleteEmail: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.db.portal_resourceEmails.findFirst({
      where: {
        id: input,
        createdBy: userId,
      },
    });

    if (!existing) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to delete this email template' });
    }

    return ctx.db.portal_resourceEmails.delete({
      where: { id: input },
    });
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
      return ctx.db.portal_resourceContentSendTrack.create({
        data: {
          resourceId: input.resourceId,
          contactId: input.contactId,
          sentBy: ctx.session.user.id,
          status: input.status,
          metadata: input.metadata,
        },
      });
    }),

  getContentSendHistory: protectedProcedure
    .input(
      z.object({
        resourceId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const content = await ctx.db.portal_resourceContent.findFirst({
        include: {
          portal_resourceContentShare: true,
        },
        where: {
          id: input.resourceId,
          OR: [
            { createdBy: userId },
            { visibility: 'PUBLIC' },
            {
              AND: [
                { visibility: 'SHARED' },
                {
                  portal_resourceContentShare: {
                    some: {
                      sharedWithUserId: userId,
                    },
                  },
                },
              ],
            },
          ],
        },
      });

      if (!content) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to view this content' });
      }

      return ctx.db.portal_resourceContentSendTrack.findMany({
        select: {
          id: true,
          sentAt: true,
          status: true,
          metadata: true,
          contact: true,
          sentByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        where: {
          resourceId: input.resourceId,
        },
        orderBy: {
          sentAt: 'asc',
        },
      });
    }),
});
