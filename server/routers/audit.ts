import { and, desc, eq, gte, like, lte, sql } from 'drizzle-orm';
import { z } from 'zod/v4';
import { auditLog, user } from '@/drizzle/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const auditRouter = createTRPCRouter({
  // Get paginated audit logs with filters
  getLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        userId: z.string().optional(),
        action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
        resource: z
          .enum([
            'account',
            'admin',
            'api-key',
            'calendar',
            'company',
            'contact',
            'resource',
            'site',
            'task',
            'team',
            'user',
            'notification',
          ])
          .optional(),
        routerName: z.string().optional(),
        procedureName: z.string().optional(),
        status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        userId: filterUserId,
        action,
        resource,
        routerName,
        procedureName,
        status,
        startDate,
        endDate,
        search,
      } = input;

      const offset = (page - 1) * pageSize;

      // Build dynamic where conditions
      const whereConditions: any[] = [];

      if (filterUserId) {
        whereConditions.push(eq(auditLog.userId, filterUserId));
      }

      if (action) {
        whereConditions.push(eq(auditLog.action, action));
      }

      if (resource) {
        whereConditions.push(eq(auditLog.resource, resource));
      }

      if (routerName) {
        whereConditions.push(eq(auditLog.routerName, routerName));
      }

      if (procedureName) {
        whereConditions.push(eq(auditLog.procedureName, procedureName));
      }

      if (status) {
        whereConditions.push(eq(auditLog.status, status));
      }

      if (startDate) {
        whereConditions.push(gte(auditLog.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(auditLog.createdAt, endDate));
      }

      if (search) {
        const searchLower = search.toLowerCase();
        whereConditions.push(
          sql`(
            LOWER(${auditLog.procedureName}) LIKE ${`%${searchLower}%`} OR
            LOWER(${auditLog.resource}) LIKE ${`%${searchLower}%`} OR
            LOWER(${auditLog.routerName}) LIKE ${`%${searchLower}%`} OR
            LOWER(${auditLog.errorMessage}) LIKE ${`%${searchLower}%`}
          )`
        );
      }

      // Get total count
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(auditLog)
        .where(
          whereConditions.length > 0
            ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
            : undefined
        )
        .then((rows) => rows[0]);

      const totalCount = Number(countResult.count);

      // Get paginated results with user information
      const results = await ctx.db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          resource: auditLog.resource,
          resourceId: auditLog.resourceId,
          routerName: auditLog.routerName,
          procedureName: auditLog.procedureName,
          inputData: auditLog.inputData,
          previousData: auditLog.previousData,
          newData: auditLog.newData,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          status: auditLog.status,
          errorMessage: auditLog.errorMessage,
          duration: auditLog.duration,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })
        .from(auditLog)
        .innerJoin(user, eq(auditLog.userId, user.id))
        .where(
          whereConditions.length > 0
            ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
            : undefined
        )
        .orderBy(desc(auditLog.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        data: results,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    }),

  // Get audit log by ID
  getLogById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          resource: auditLog.resource,
          resourceId: auditLog.resourceId,
          routerName: auditLog.routerName,
          procedureName: auditLog.procedureName,
          inputData: auditLog.inputData,
          previousData: auditLog.previousData,
          newData: auditLog.newData,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          status: auditLog.status,
          errorMessage: auditLog.errorMessage,
          duration: auditLog.duration,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })
        .from(auditLog)
        .innerJoin(user, eq(auditLog.userId, user.id))
        .where(eq(auditLog.id, input.id))
        .limit(1)
        .then((rows) => rows[0]);

      return result;
    }),

  // Get audit statistics
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const whereConditions: any[] = [];

      if (startDate) {
        whereConditions.push(gte(auditLog.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lte(auditLog.createdAt, endDate));
      }

      // Get overall statistics
      const totalStats = await ctx.db
        .select({
          total: sql<number>`count(*)`,
          successful: sql<number>`count(*) filter (where ${auditLog.status} = 'SUCCESS')`,
          failed: sql<number>`count(*) filter (where ${auditLog.status} = 'FAILED')`,
          pending: sql<number>`count(*) filter (where ${auditLog.status} = 'PENDING')`,
          avgDuration: sql<number>`avg(${auditLog.duration}) filter (where ${auditLog.duration} is not null)`,
        })
        .from(auditLog)
        .where(
          whereConditions.length > 0
            ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
            : undefined
        )
        .then((rows) => rows[0]);

      // Get action breakdown
      const actionStats = await ctx.db
        .select({
          action: auditLog.action,
          count: sql<number>`count(*)`,
        })
        .from(auditLog)
        .where(
          whereConditions.length > 0
            ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
            : undefined
        )
        .groupBy(auditLog.action);

      // Get resource breakdown
      const resourceStats = await ctx.db
        .select({
          resource: auditLog.resource,
          count: sql<number>`count(*)`,
        })
        .from(auditLog)
        .where(
          whereConditions.length > 0
            ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
            : undefined
        )
        .groupBy(auditLog.resource)
        .orderBy(desc(sql<number>`count(*)`));

      // Get top users by activity
      const topUsers = await ctx.db
        .select({
          userId: auditLog.userId,
          count: sql<number>`count(*)`,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })
        .from(auditLog)
        .innerJoin(user, eq(auditLog.userId, user.id))
        .where(
          whereConditions.length > 0
            ? sql`${whereConditions.reduce((acc, cond, i) => (i === 0 ? cond : sql`${acc} AND ${cond}`))}`
            : undefined
        )
        .groupBy(
          auditLog.userId,
          user.id,
          user.name,
          user.email,
          user.firstName,
          user.lastName
        )
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10);

      return {
        total: totalStats,
        actions: actionStats,
        resources: resourceStats,
        topUsers,
      };
    }),

  // Get recent activity for a specific resource
  getResourceActivity: protectedProcedure
    .input(
      z.object({
        resource: z.enum([
          'account',
          'admin',
          'api-key',
          'calendar',
          'company',
          'contact',
          'resource',
          'site',
          'task',
          'team',
          'user',
          'notification',
        ]),
        resourceId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { resource, resourceId, limit } = input;

      const results = await ctx.db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          procedureName: auditLog.procedureName,
          status: auditLog.status,
          errorMessage: auditLog.errorMessage,
          duration: auditLog.duration,
          createdAt: auditLog.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })
        .from(auditLog)
        .innerJoin(user, eq(auditLog.userId, user.id))
        .where(
          and(
            eq(auditLog.resource, resource),
            eq(auditLog.resourceId, resourceId)
          )
        )
        .orderBy(desc(auditLog.createdAt))
        .limit(limit);

      return results;
    }),
});
