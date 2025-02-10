import User from '@/database/models/User';
import { generateUUID } from '@/lib/utils';
import { TRPCError } from '@trpc/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const currentUser = await User.findById(ctx.session.user.id);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Only admins can access this resource',
    });
  }

  return next();
});

export const adminRouter = createTRPCRouter({
  getMe: adminProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  getUsers: adminProcedure.query(async ({ ctx }) => {
    return User.find();
  }),

  getUser: adminProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return User.findById(input);
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['ADMIN', 'SALES', 'MANAGER', 'USER']),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return User.create({
        _id: generateUUID(),
        ...input,
      });
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SALES', 'MANAGER', 'USER']).nullish(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      if (input.firstName && input.lastName) {
        updateData.name = `${input.firstName} ${input.lastName}`;
      }

      return User.findByIdAndUpdate(id, updateData, { new: true });
    }),

  deleteUser: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const User = mongoose.models.User;
    return User.findByIdAndDelete(input);
  }),
});
