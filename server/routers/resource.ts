import { ResourceContent } from '@/database/models/resourceContent';
import { ResourceContentSendTrack } from '@/database/models/resourceContentSendTrack';
import { ResourceContentShare } from '@/database/models/resourceContentShare';
import { ResourceEmails } from '@/database/models/resourceEmails';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import type { FilterQuery } from 'mongoose';
import { z } from 'zod';

const resourceContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  tags: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

const resourceEmailSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  content: z.string().min(1),
  tags: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'SHARED', 'PRIVATE']),
});

interface ResourceContentDocument {
  _id: string;
  title: string;
  description?: string;
  content: string;
  tags?: string;
  visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ResourceEmailDocument {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  content: string;
  tags?: string;
  visibility: 'PUBLIC' | 'SHARED' | 'PRIVATE';
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const resourceRouter = createTRPCRouter({
  createContent: protectedProcedure.input(resourceContentSchema).mutation(async ({ ctx, input }) => {
    return await ResourceContent.create({
      ...input,
      createdBy: ctx.session.user.id,
      updatedBy: ctx.session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      let query: FilterQuery<ResourceContentDocument> = {
        $or: [
          { createdBy: userId },
          { visibility: 'PUBLIC' },
          {
            $and: [
              { visibility: 'SHARED' },
              {
                _id: {
                  $in: await ResourceContentShare.distinct('resourceId', {
                    sharedWithUserId: userId,
                  }),
                },
              },
            ],
          },
        ],
      };

      if (input?.visibility) {
        query = {
          $and: [query, { visibility: { $in: input.visibility } }],
        } as FilterQuery<ResourceContentDocument>;
      }

      if (input?.search) {
        query = {
          $and: [
            query,
            {
              $or: [{ title: { $regex: input.search, $options: 'i' } }, { description: { $regex: input.search, $options: 'i' } }],
            },
          ],
        } as FilterQuery<ResourceContentDocument>;
      }

      if (input?.tags && input.tags.length > 0) {
        const tagConditions = input.tags.map((tag) => ({
          tags: { $regex: tag, $options: 'i' },
        }));
        query = {
          $and: [query, { $or: tagConditions }],
        } as FilterQuery<ResourceContentDocument>;
      }

      const resources = await ResourceContent.find(query).sort({ updatedAt: -1 }).lean();

      const resourceIds = resources.map((r) => r._id);

      const [sendTracks, shares] = await Promise.all([
        ResourceContentSendTrack.aggregate([
          {
            $match: { resourceId: { $in: resourceIds } },
          },
          {
            $lookup: {
              from: 'contact',
              localField: 'contactId',
              foreignField: '_id',
              as: 'contact',
            },
          },
          {
            $group: {
              _id: '$resourceId',
              sendCount: { $sum: 1 },
              lastSentAt: { $max: '$sentAt' },
              recipients: {
                $push: {
                  $cond: [
                    { $ne: [{ $arrayElemAt: ['$contact', 0] }, null] },
                    {
                      id: { $arrayElemAt: ['$contact._id', 0] },
                      name: { $arrayElemAt: ['$contact.name', 0] },
                      email: { $arrayElemAt: ['$contact.email', 0] },
                    },
                    null,
                  ],
                },
              },
            },
          },
        ]),
        ResourceContentShare.find({ resourceId: { $in: resourceIds } }).lean(),
      ]);

      return resources.map((resource) => {
        const sendTrack = sendTracks.find((st) => st._id.equals(resource._id));
        const resourceShares = shares.filter((s) => s.resourceId.equals(resource._id));
        return {
          ...resource,
          sendCount: sendTrack?.sendCount || 0,
          lastSentAt: sendTrack?.lastSentAt || null,
          recipients: sendTrack?.recipients.filter(Boolean) || [],
          shares: resourceShares,
        };
      });
    }),

  getContent: protectedProcedure.input(z.object({ id: z.string(), includeShare: z.boolean().optional() })).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const resource = await ResourceContent.findOne({
      _id: input.id,
      $or: [
        { createdBy: userId },
        { visibility: 'PUBLIC' },
        {
          $and: [
            { visibility: 'SHARED' },
            {
              _id: {
                $in: await ResourceContentShare.distinct('resourceId', {
                  sharedWithUserId: userId,
                }),
              },
            },
          ],
        },
      ],
    }).lean();

    if (!resource) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
    }

    if (input.includeShare) {
      const shares = await ResourceContentShare.find({ resourceId: resource._id }).lean();
      return { ...resource, shares };
    }

    return resource;
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

      const resource = await ResourceContent.findOne({
        _id: input.id,
        $or: [
          { createdBy: userId },
          {
            $and: [
              { visibility: 'SHARED' },
              {
                _id: {
                  $in: await ResourceContentShare.distinct('resourceId', {
                    sharedWithUserId: userId,
                    permission: 'edit',
                  }),
                },
              },
            ],
          },
        ],
      });

      if (!resource) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to edit this content' });
      }

      return await ResourceContent.findByIdAndUpdate(
        input.id,
        {
          ...input.data,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        { new: true }
      );
    }),

  deleteContent: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const resource = await ResourceContent.findOne({
      _id: input,
      createdBy: userId,
    });

    if (!resource) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to delete this content' });
    }

    await Promise.all([ResourceContent.findByIdAndDelete(input), ResourceContentShare.deleteMany({ resourceId: input }), ResourceContentSendTrack.deleteMany({ resourceId: input })]);

    return { success: true };
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

      const resource = await ResourceContent.findOne({
        _id: input.resourceId,
        createdBy: userId,
      });

      if (!resource) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to share this content' });
      }

      if (resource.visibility === 'PRIVATE') {
        await ResourceContent.findByIdAndUpdate(input.resourceId, { visibility: 'SHARED' });
      }

      await ResourceContentShare.deleteMany({
        resourceId: input.resourceId,
        sharedWithUserId: { $in: input.userIds },
      });

      return await ResourceContentShare.insertMany(
        input.userIds.map((userId) => ({
          resourceId: input.resourceId,
          sharedWithUserId: userId,
          permission: input.permission,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
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

      const resource = await ResourceContent.findOne({
        _id: input.resourceId,
        createdBy: userId,
      });

      if (!resource) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to modify shares for this content' });
      }

      await ResourceContentShare.deleteOne({
        resourceId: input.resourceId,
        sharedWithUserId: input.userId,
      });

      return { success: true };
    }),

  createEmail: protectedProcedure.input(resourceEmailSchema).mutation(async ({ ctx, input }) => {
    return await ResourceEmails.create({
      ...input,
      createdBy: ctx.session.user.id,
      updatedBy: ctx.session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      let query: FilterQuery<ResourceEmailDocument> = {
        $or: [{ createdBy: userId }, { visibility: 'PUBLIC' }],
      };

      if (input?.visibility) {
        query = {
          $and: [query, { visibility: input.visibility }],
        } as FilterQuery<ResourceEmailDocument>;
      }

      if (input?.search) {
        query = {
          $and: [
            query,
            {
              $or: [{ title: { $regex: input.search, $options: 'i' } }, { description: { $regex: input.search, $options: 'i' } }, { subject: { $regex: input.search, $options: 'i' } }],
            },
          ],
        } as FilterQuery<ResourceEmailDocument>;
      }

      if (input?.tags && input.tags.length > 0) {
        const tagConditions = input.tags.map((tag) => ({
          tags: { $regex: tag, $options: 'i' },
        }));
        query = {
          $and: [query, { $or: tagConditions }],
        } as FilterQuery<ResourceEmailDocument>;
      }

      return await ResourceEmails.find(query).sort({ updatedAt: -1 }).lean();
    }),

  getEmail: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const email = await ResourceEmails.findOne({
      _id: input,
      $or: [{ createdBy: userId }, { visibility: 'PUBLIC' }],
    }).lean();

    if (!email) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Email template not found' });
    }

    return email;
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

      const email = await ResourceEmails.findOne({
        _id: input.id,
        createdBy: userId,
      });

      if (!email) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to edit this email template' });
      }

      return await ResourceEmails.findByIdAndUpdate(
        input.id,
        {
          ...input.data,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        { new: true }
      );
    }),

  deleteEmail: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const email = await ResourceEmails.findOne({
      _id: input,
      createdBy: userId,
    });

    if (!email) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to delete this email template' });
    }

    await ResourceEmails.findByIdAndDelete(input);
    return { success: true };
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
      return await ResourceContentSendTrack.create({
        resourceId: input.resourceId,
        contactId: input.contactId,
        sentBy: ctx.session.user.id,
        sentAt: new Date(),
        status: input.status,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      const resource = await ResourceContent.findOne({
        _id: input.resourceId,
        $or: [
          { createdBy: userId },
          { visibility: 'PUBLIC' },
          {
            $and: [
              { visibility: 'SHARED' },
              {
                _id: {
                  $in: await ResourceContentShare.distinct('resourceId', {
                    sharedWithUserId: userId,
                  }),
                },
              },
            ],
          },
        ],
      });

      if (!resource) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authorized to view this content' });
      }

      const sendHistory = await ResourceContentSendTrack.aggregate([
        {
          $match: { resourceId: resource._id },
        },
        {
          $lookup: {
            from: 'contact',
            localField: 'contactId',
            foreignField: '_id',
            as: 'contact',
          },
        },
        {
          $lookup: {
            from: 'user',
            localField: 'sentBy',
            foreignField: '_id',
            as: 'sentBy',
          },
        },
        {
          $project: {
            id: '$_id',
            sentAt: 1,
            status: 1,
            metadata: 1,
            contact: { $arrayElemAt: ['$contact', 0] },
            sentBy: { $arrayElemAt: ['$sentBy', 0] },
          },
        },
        {
          $sort: { sentAt: 1 },
        },
      ]);

      return sendHistory;
    }),
});
