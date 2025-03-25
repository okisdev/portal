import {
  account,
  authenticator,
  calendarEvent,
  calendarEventParticipant,
  calendarEventShare,
  calendarFolder,
  contact,
  contactActivity,
  contactDeal,
  marketingCampaign,
  paymentTrack,
  resourceContent,
  resourceContentSendTrack,
  session,
  subscriptionCoupon,
  subscriptionPlan,
  team,
  teamActivity,
  user,
  userNotifications,
  userTask,
} from '@/drizzle/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const credentialSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be more than 8 characters').max(32, 'Password must be less than 32 characters'),
});

export const activityTypeSchema = z.enum([
  'CONTACT', // Contact-related activities
  'STATUS', // Status changes
  'PRIORITY', // Priority changes
  'SOURCE', // Source changes
  'DATE', // Date-related activities
  'TEAM', // Team-related activities
  'CAMPAIGN', // Campaign-related activities
  'DEAL', // Deal-related activities
  'PAYMENT', // Payment-related activities
  'ENGAGEMENT', // Engagement activities like calls, emails
]);

export const activitySubTypeSchema = z.enum([
  // Contact Management
  'CONTACT_CREATED',
  'CONTACT_UPDATED',
  'CONTACT_DELETED',

  // Changes
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'SOURCE_CHANGED',

  // Date Related
  'LAST_CONTACTED_UPDATED',
  'LAST_CONTACTED_REMOVED',
  'NEXT_FOLLOW_UP_UPDATED',
  'NEXT_FOLLOW_UP_REMOVED',

  // Engagement
  'MEETING_SCHEDULED',
  'MEETING_UPDATED',
  'MEETING_CANCELLED',
  'CALL_LOGGED',
  'EMAIL_SENT',
  'EMAIL_SCHEDULED',
  'MESSAGE_SENT',
  'MESSAGE_RECEIVED',
  'NOTE_ADDED',
  'REMARK_UPDATED',

  // Team Management
  'TEAM_CREATED',
  'TEAM_UPDATED',
  'TEAM_DELETED',
  'TEAM_CONTACT_ASSIGNED',
  'TEAM_CONTACT_REMOVED',

  // Campaign Management
  'CAMPAIGN_ASSIGNED',
  'CAMPAIGN_REMOVED',
  'CAMPAIGN_UPDATED',

  // Deal Management
  'DEAL_CREATED',
  'DEAL_UPDATED',
  'DEAL_CLOSED',

  // Payment
  'PAYMENT_LINK_CLICKED',
  'PAYMENT_COMPLETED',
]);

export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ActivitySubType = z.infer<typeof activitySubTypeSchema>;

export const statusSchema = z.enum(['lead', 'appointment', 'follow_up', 'called', 'called_no_answer', 'after_pitching', 'key_person', 'special', 'trial', 'final', 'closed', 'junk']);

export type Status = z.infer<typeof statusSchema>;

export const prioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);

export type Priority = z.infer<typeof prioritySchema>;

export const sourceSchema = z.enum(['Pitching', 'Referral', 'Website', 'Email', 'Instagram', 'LinkedIn', 'WhatsApp', 'Facebook', 'BNI', 'No Planner', 'Pay Trial', 'Other']);

export type Source = z.infer<typeof sourceSchema>;

export const userRoleSchema = z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_ASSISTANT', 'MANAGER', 'USER']);

export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = createSelectSchema(user);

export type User = z.infer<typeof userSchema>;

export const userTaskSchema = createSelectSchema(userTask);

export type UserTask = z.infer<typeof userTaskSchema>;

export const teamSchema = createSelectSchema(team);

export type Team = z.infer<typeof teamSchema>;

export const teamActivitySchema = createSelectSchema(teamActivity);

export type TeamActivity = z.infer<typeof teamActivitySchema>;

export const accountSchema = createSelectSchema(account);

export type Account = z.infer<typeof accountSchema>;

export const authenticatorSchema = createSelectSchema(authenticator);

export type Authenticator = z.infer<typeof authenticatorSchema>;

export const sessionSchema = createSelectSchema(session);

export type Session = z.infer<typeof sessionSchema>;

export const contactSchema = createSelectSchema(contact);

export type Contact = z.infer<typeof contactSchema>;

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

export const notificationsSchema = createSelectSchema(userNotifications);

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

export const resourceContentSchema = createSelectSchema(resourceContent);

export type ResourceContent = z.infer<typeof resourceContentSchema>;

export const marketingCampaignSchema = createSelectSchema(marketingCampaign);

export type MarketingCampaign = z.infer<typeof marketingCampaignSchema> & {
  contactCount?: number;
  convertedCount?: number;
};

export const resourceContentSendTrackSchema = createSelectSchema(resourceContentSendTrack);

export type ResourceContentSendTrack = z.infer<typeof resourceContentSendTrackSchema>;

export const appointmentSchema = z.object({
  title: z.string(),
  description: z.string(),
  startAt: z.date(),
  endAt: z.date(),
  contactId: z.string(),
});

export const timezoneSchema = z.enum([
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Edmonton',
  'America/Halifax',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'Asia/Hong_Kong',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Indian/Maldives',
  'Indian/Mauritius',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Pacific/Noumea',
  'Pacific/Pago_Pago',
  'Pacific/Port_Moresby',
  'Pacific/Tongatapu',
  'UTC',
]);

export type Timezone = z.infer<typeof timezoneSchema>;
