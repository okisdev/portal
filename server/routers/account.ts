import { User } from '@/database/models/user';
import { timezoneSchema } from '@/lib/schema';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { encryptPassword } from '@/utils/password';
import { TRPCError } from '@trpc/server';
import z from 'zod';

export const accountRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  getMeFromDatabase: protectedProcedure.query(async ({ ctx }) => {
    const user = await User.findById(ctx.session.user.id).select({
      id: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      image: 1,
      name: 1,
      emailVerified: 1,
      role: 1,
      username: 1,
      timezone: 1,
    });

    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    return { ...user.toObject(), id: user._id.toString() };
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
          .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens')
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (input.username) {
        const existingUser = await User.findOne({ username: input.username });
        if (existingUser) throw new TRPCError({ code: 'CONFLICT', message: 'Username already exists' });
      }

      // First get the current user data to properly handle name updates
      const currentUser = await User.findById(ctx.session.user.id).select('firstName lastName');
      if (!currentUser) throw new TRPCError({ code: 'NOT_FOUND' });

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
        const newFirstName = input.firstName ?? currentUser.firstName ?? '';
        const newLastName = input.lastName ?? currentUser.lastName ?? '';
        updateData.name = `${newFirstName} ${newLastName}`.trim();
      }

      return User.findByIdAndUpdate(ctx.session.user.id, updateData, { new: true });
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const hashedPassword = encryptPassword(input.newPassword);

      return User.findByIdAndUpdate(ctx.session.user.id, { password: hashedPassword }, { new: true });
    }),

  updateTimezone: protectedProcedure
    .input(
      z.object({
        timezone: timezoneSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

      return User.findByIdAndUpdate(ctx.session.user.id, { timezone: input.timezone }, { new: true });
    }),
});
