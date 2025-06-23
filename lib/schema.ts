import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod/v4';
import type {
  account,
  authenticator,
  calendarEvent,
  calendarEventParticipant,
  calendarEventShare,
  calendarFolder,
  company,
  companyContact,
  companyCustomField,
  companyCustomValue,
  contact,
  contactActivity,
  contactCustomField,
  contactCustomValue,
  paymentTrack,
  resourceContent,
  resourceContentSendTrack,
  resourceContentShare,
  resourceEmails,
  session,
  siteConfig,
  team,
  teamActivity,
  teamContact,
  teamCustomField,
  teamCustomValue,
  teamMeeting,
  user,
  userNotifications,
  userTask,
} from '@/drizzle/schema';

// Shared Schema

export const credentialSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be more than 8 characters')
    .max(32, 'Password must be less than 32 characters'),
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

export const basicTagSchema = z.object({
  value: z.string(),
  color: z.string(),
});

export type BasicTag = z.infer<typeof basicTagSchema>;

export type Status = BasicTag;
export type Source = BasicTag;
export type Priority = BasicTag;

export const userRoleSchema = z.enum([
  'ADMIN',
  'SALES_MANAGER',
  'SALES_ASSISTANT',
  'MANAGER',
  'USER',
]);

export type UserRole = z.infer<typeof userRoleSchema>;

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

// Database Schema

export type User = InferSelectModel<typeof user>;

export type Account = InferSelectModel<typeof account>;

export type Authenticator = InferSelectModel<typeof authenticator>;

export type Session = InferSelectModel<typeof session>;

export type Contact = InferSelectModel<typeof contact>;

export type CompanyContact = InferSelectModel<typeof companyContact>;

export type ContactActivity = InferSelectModel<typeof contactActivity>;

export type PaymentTrack = InferSelectModel<typeof paymentTrack>;

export type Notifications = InferSelectModel<typeof userNotifications>;

export type CalendarFolder = InferSelectModel<typeof calendarFolder>;

export type CalendarEvent = InferSelectModel<typeof calendarEvent>;

export type CalendarEventShare = InferSelectModel<typeof calendarEventShare>;

export type CalendarEventParticipant = InferSelectModel<
  typeof calendarEventParticipant
>;

export type ResourceContent = InferSelectModel<typeof resourceContent>;

export type ResourceContentShare = InferSelectModel<
  typeof resourceContentShare
>;

export type ResourceContentSendTrack = InferSelectModel<
  typeof resourceContentSendTrack
>;

export type ResourceEmails = InferSelectModel<typeof resourceEmails>;

export type Company = InferSelectModel<typeof company> & {
  teams?: number;
};

export type Team = InferSelectModel<typeof team>;

export type TeamContact = InferSelectModel<typeof teamContact>;

export type TeamActivity = InferSelectModel<typeof teamActivity>;

export type UserTask = InferSelectModel<typeof userTask>;

export type TeamMeeting = InferSelectModel<typeof teamMeeting>;

export type ContactCustomField = InferSelectModel<typeof contactCustomField>;

export type ContactCustomValue = InferSelectModel<typeof contactCustomValue>;

export type TeamCustomField = InferSelectModel<typeof teamCustomField>;

export type TeamCustomValue = InferSelectModel<typeof teamCustomValue>;

export type CompanyCustomField = InferSelectModel<typeof companyCustomField>;

export type CompanyCustomValue = InferSelectModel<typeof companyCustomValue>;

export type SiteConfig = InferSelectModel<typeof siteConfig>;

export type CalendarEventWithParticipants = CalendarEvent & {
  participants: CalendarEventParticipant[];
};
