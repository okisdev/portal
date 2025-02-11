import { z } from 'zod';

export const credentialSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be more than 8 characters').max(32, 'Password must be less than 32 characters'),
});

export const activityTypeSchema = z.enum([
  'CONTACT', // Contact-related activities
  'STATUS', // Status changes
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

  // Status Changes
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',

  // Date Related
  'LAST_CONTACTED',
  'NEXT_FOLLOW_UP',

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
  'TEAM_ASSIGNED',
  'TEAM_REMOVED',
  'TEAM_UPDATED',

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

export const statusSchema = z.enum(['lead', 'appointment', 'pitch', 'trial', 'final', 'closed', 'junk']);

export type Status = z.infer<typeof statusSchema>;

export const prioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);

export type Priority = z.infer<typeof prioritySchema>;

export const sourceSchema = z.enum(['Pitching', 'Referral', 'Website', 'Email', 'IG', 'LinkedIn', 'Facebook', 'Other']);

export type Source = z.infer<typeof sourceSchema>;

export const userRoleSchema = z.enum(['ADMIN', 'SALES', 'MANAGER', 'USER']);

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
