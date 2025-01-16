import {
  account,
  authenticator,
  calendarEvent,
  calendarEventParticipant,
  calendarEventShare,
  calendarFolder,
  contact,
  contactActivity,
  contactConversation,
  contactDeal,
  notifications,
  paymentTrack,
  session,
  subscriptionCoupon,
  subscriptionPlan,
  user,
} from '@/drizzle/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

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

export const accountSchema = createSelectSchema(account);

export type Account = z.infer<typeof accountSchema>;

export const authenticatorSchema = createSelectSchema(authenticator);

export type Authenticator = z.infer<typeof authenticatorSchema>;

export const sessionSchema = createSelectSchema(session);

export type Session = z.infer<typeof sessionSchema>;

export const contactSchema = createSelectSchema(contact);

export type Contact = z.infer<typeof contactSchema>;

export const contactConversationSchema = createSelectSchema(contactConversation);

export type ContactConversation = z.infer<typeof contactConversationSchema>;

export const contactDealSchema = createSelectSchema(contactDeal);

export type ContactDeal = z.infer<typeof contactDealSchema>;

export const contactActivitySchema = createSelectSchema(contactActivity);

export type ContactActivity = z.infer<typeof contactActivitySchema>;

export const paymentTrackSchema = createSelectSchema(paymentTrack);

export type PaymentTrack = z.infer<typeof paymentTrackSchema>;

export const subscriptionCouponSchema = createSelectSchema(subscriptionCoupon);

export type SubscriptionCoupon = z.infer<typeof subscriptionCouponSchema>;

export const subscriptionPlanSchema = createSelectSchema(subscriptionPlan);

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const notificationsSchema = createSelectSchema(notifications);

export type Notifications = z.infer<typeof notificationsSchema>;

export const calendarFolderSchema = createSelectSchema(calendarFolder);

export type CalendarFolder = z.infer<typeof calendarFolderSchema>;

export const calendarEventSchema = createSelectSchema(calendarEvent);

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const calendarEventShareSchema = createSelectSchema(calendarEventShare);

export type CalendarEventShare = z.infer<typeof calendarEventShareSchema>;

export const calendarEventParticipantSchema = createSelectSchema(calendarEventParticipant);

export type CalendarEventParticipant = z.infer<typeof calendarEventParticipantSchema>;

export type CalendarEventWithParticipants = CalendarEvent & {
  participants: CalendarEventParticipant[];
};
