import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod/v4';
import { user } from '@/drizzle/schema';
import { timezoneSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

export const accountRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;

    // if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

    // return ctx.db
    //   .select()
    //   .from(user)
    //   .where(eq(user.id, ctx.session.user.id))
    //   .then(([user]) => user);
  }),

  getMeFromDatabase: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        username: user.username,
        timezone: user.timezone,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .then(([user]) => user);
  }),

  updateMe: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        image: z.string().optional(),
        username: z
          .string()
          .regex(
            /^[a-z0-9_-]+$/,
            'Username can only contain lowercase letters, numbers, underscores, and hyphens'
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      if (input.username) {
        const existingUser = await ctx.db
          .select()
          .from(user)
          .where(eq(user.username, input.username))
          .then((rows) => rows[0]);
        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Username already exists',
          });
        }
      }

      // First get the current user data to properly handle name updates
      const currentUser = await ctx.db
        .select({
          firstName: user.firstName,
          lastName: user.lastName,
        })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .then((rows) => rows[0]);

      // Prepare update data only with provided fields
      const updateData: Record<string, unknown> = {};

      if (input.firstName !== undefined) {
        updateData.firstName = input.firstName;
      }
      if (input.lastName !== undefined) {
        updateData.lastName = input.lastName;
      }
      if (input.email !== undefined) {
        updateData.email = input.email;
      }
      if (input.image !== undefined) {
        updateData.image = input.image;
      }
      if (input.username !== undefined) {
        updateData.username = input.username;
      }

      // Only update name if either firstName or lastName was provided
      if (input.firstName !== undefined || input.lastName !== undefined) {
        const newFirstName = input.firstName ?? currentUser?.firstName ?? '';
        const newLastName = input.lastName ?? currentUser?.lastName ?? '';
        updateData.name = `${newFirstName} ${newLastName}`.trim();
      }

      return ctx.db
        .update(user)
        .set(updateData)
        .where(eq(user.id, ctx.session.user.id));
    }),

  updateTimezone: protectedProcedure
    .input(
      z.object({
        timezone: timezoneSchema,
      })
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      return ctx.db
        .update(user)
        .set({ timezone: input.timezone })
        .where(eq(user.id, ctx.session.user.id));
    }),
});
