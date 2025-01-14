import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { user } from '@/drizzle/schema';

export const credentialSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be more than 8 characters').max(32, 'Password must be less than 32 characters'),
});

export const statusSchema = z.enum(['lead', 'prospect', 'customer', 'churned', 'opportunity']);

export type Status = z.infer<typeof statusSchema>;

// 'lead' - Initial contact, needs qualification
// 'prospect' - Qualified lead, actively engaged
// 'customer' - Current paying customer
// 'churned' - Previous customer, no longer active
// 'opportunity' - Qualified lead with high potential
export const prioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);

export type Priority = z.infer<typeof prioritySchema>;

export const userRoleSchema = z.enum(['ADMIN', 'SALES', 'MANAGER', 'USER']);

export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = createSelectSchema(user);

export type User = z.infer<typeof userSchema>;
