import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { user } from '@/drizzle/schema';
import { protectedProcedure } from '@/server/trpc';

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const currentUser = await ctx.db
    .select()
    .from(user)
    .where(eq(user.id, ctx.session.user.id))
    .then((res) => res[0]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Only admins can access this resource',
    });
  }

  return next();
});
