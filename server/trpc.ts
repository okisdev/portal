/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import superjson from 'superjson';
import { ZodError } from 'zod/v4';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    db: database,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware
 */
export const middleware = t.middleware;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 * Also includes audit logging for all mutations.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(
  async ({ ctx, next, path, type, input }) => {
    // Authentication check
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Create properly typed context
    const authenticatedCtx = {
      ...ctx,
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    };

    // Only audit mutations, not queries or subscriptions
    if (type !== 'mutation') {
      return next({ ctx: authenticatedCtx });
    }

    // Skip audit logging for the audit router itself to prevent infinite loops
    if (path.startsWith('audit.')) {
      return next({ ctx: authenticatedCtx });
    }

    const startTime = Date.now();
    const [routerName, procedureName] = path.split('.');

    // Get client info from headers if available
    const requestHeaders = ctx.headers;
    const ipAddress =
      requestHeaders?.get('x-forwarded-for')?.split(',')[0] ||
      requestHeaders?.get('x-real-ip') ||
      requestHeaders?.get('cf-connecting-ip') ||
      requestHeaders?.get('x-client-ip') ||
      'unknown';

    const userAgent = requestHeaders?.get('user-agent') || 'unknown';

    // Import audit utilities here to avoid circular dependencies
    const { createAuditLog, extractResourceId, sanitizeDataForAudit } =
      await import('@/utils/audit');

    const auditContext = {
      userId: authenticatedCtx.session.user.id,
      ipAddress,
      userAgent,
      routerName,
      procedureName,
    };

    // Sanitize input data for logging
    const sanitizedInput = sanitizeDataForAudit(input);

    // Type guard for input with id
    const hasIdProperty = (obj: unknown): obj is { id: string } => {
      return (
        obj !== null &&
        typeof obj === 'object' &&
        'id' in obj &&
        typeof (obj as { id: unknown }).id === 'string'
      );
    };

    try {
      // Get previous data for update/delete operations (simplified for now)
      let previousData: unknown = null;

      // For operations that might need previous data, try to fetch it
      if (hasIdProperty(input)) {
        // For now, we'll skip fetching previous data to avoid complex schema references
        // This can be implemented later with proper schema imports
        previousData = null;
      }

      // Execute the actual procedure
      const result = await next({ ctx: authenticatedCtx });
      const duration = Date.now() - startTime;

      // Extract resource ID from input or result
      const resourceId = extractResourceId(
        input,
        result.ok ? result.data : undefined
      );

      // Create audit log entry for successful operation
      await createAuditLog({
        context: auditContext,
        resourceId,
        inputData: sanitizedInput,
        previousData: sanitizeDataForAudit(previousData),
        newData: sanitizeDataForAudit(result.ok ? result.data : undefined),
        status: 'SUCCESS',
        duration,
        db: authenticatedCtx.db,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const resourceId = extractResourceId(input);

      // Create audit log entry for failed operation
      await createAuditLog({
        context: auditContext,
        resourceId,
        inputData: sanitizedInput,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration,
        db: authenticatedCtx.db,
      });

      // Re-throw the error to maintain normal error handling
      throw error;
    }
  }
);
