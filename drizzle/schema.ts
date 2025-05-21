import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const user = pgTable('portal_user', {
  id: text('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  name: text('name').notNull(),
  username: text().unique(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  role: text('role', { enum: ['ADMIN', 'SALES_MANAGER', 'SALES_ASSISTANT', 'MANAGER', 'USER'] }).default('USER'),
  timezone: text('timezone', {
    enum: [
      // Africa
      'Africa/Cairo',
      'Africa/Casablanca',
      'Africa/Johannesburg',
      'Africa/Lagos',
      'Africa/Nairobi',
      // America
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
      'America/Vancouver',
      // Asia
      'Asia/Almaty',
      'Asia/Baghdad',
      'Asia/Baku',
      'Asia/Bangkok',
      'Asia/Beirut',
      'Asia/Colombo',
      'Asia/Dhaka',
      'Asia/Dubai',
      'Asia/Ho_Chi_Minh',
      'Asia/Hong_Kong',
      'Asia/Istanbul',
      'Asia/Jakarta',
      'Asia/Jerusalem',
      'Asia/Kabul',
      'Asia/Karachi',
      'Asia/Kathmandu',
      'Asia/Kolkata',
      'Asia/Kuala_Lumpur',
      'Asia/Kuwait',
      'Asia/Manila',
      'Asia/Muscat',
      'Asia/Riyadh',
      'Asia/Seoul',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Asia/Taipei',
      'Asia/Tashkent',
      'Asia/Tehran',
      'Asia/Tokyo',
      'Asia/Ulaanbaatar',
      'Asia/Yangon',
      // Atlantic
      'Atlantic/Azores',
      'Atlantic/Cape_Verde',
      'Atlantic/Reykjavik',
      // Australia
      'Australia/Adelaide',
      'Australia/Brisbane',
      'Australia/Darwin',
      'Australia/Hobart',
      'Australia/Melbourne',
      'Australia/Perth',
      'Australia/Sydney',
      // Europe
      'Europe/Amsterdam',
      'Europe/Athens',
      'Europe/Belgrade',
      'Europe/Berlin',
      'Europe/Brussels',
      'Europe/Bucharest',
      'Europe/Budapest',
      'Europe/Copenhagen',
      'Europe/Dublin',
      'Europe/Helsinki',
      'Europe/Istanbul',
      'Europe/Kiev',
      'Europe/Lisbon',
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
      // Indian
      'Indian/Maldives',
      'Indian/Mauritius',
      // Pacific
      'Pacific/Auckland',
      'Pacific/Fiji',
      'Pacific/Guam',
      'Pacific/Honolulu',
      'Pacific/Noumea',
      'Pacific/Pago_Pago',
      'Pacific/Port_Moresby',
      'Pacific/Tongatapu',
      // UTC
      'UTC',
    ],
  })
    .notNull()
    .default('Asia/Hong_Kong'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('portal_session', {
  id: text('id').primaryKey(),
  sessionToken: text().notNull(),
  expires: timestamp({ mode: 'string' }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('portal_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('portal_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

export const contact = pgTable('portal_contact', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text(),
  phone: text(),
  gender: text(),
  company: text(),
  companyId: text().references(() => company.id),
  jobTitle: text(),
  address: text(),
  city: text(),
  state: text(),
  country: text(),
  postalCode: text(),
  remark: text(),
  status: text('status').notNull().default('Lead'),
  source: text(),
  assignedTo: text().references(() => user.id),
  stripeCustomerId: text(),
  createdBy: text().references(() => user.id),
  joinedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  lastContactedAt: timestamp({ mode: 'date' }),
  lastActivity: text('lastActivity'),
  nextFollowUpAt: timestamp({ mode: 'date' }),
  priority: text('priority').default('Medium'),
  workExperience: text(),
  currentRole: text(),
  industry: text(),
  skills: text(),
  externalId: text(),
});

export const companyContact = pgTable('portal_company_contact', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  companyId: text()
    .notNull()
    .references(() => company.id, { onDelete: 'cascade' }),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['employee', 'manager', 'executive', 'other'] }).default('employee'),
  department: text(),
  startDate: timestamp({ mode: 'date' }),
  endDate: timestamp({ mode: 'date' }),
  isActive: boolean().default(true),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const contactActivity = pgTable('portal_contact_activity', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => user.id),
  type: text('type', {
    enum: [
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
    ],
  }).notNull(),
  subType: text('subType', {
    enum: [
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
    ],
  }),
  initiatorType: text('initiatorType', { enum: ['user', 'contact', 'system'] })
    .notNull()
    .default('system'),
  initiatorId: text('initiatorId'),
  description: text(),
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const paymentTrack = pgTable('portal_payment_track', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => user.id), // who created the payment link
  amount: integer().notNull(), // in cents
  currency: text().notNull().default('usd'),
  status: text().notNull().default('pending'), // 'pending', 'clicked', 'paid', 'failed'
  stripePaymentId: text(), // Stripe payment intent ID
  linkClicked: boolean().default(false),
  clickedAt: timestamp({ mode: 'date' }),
  paidAt: timestamp({ mode: 'date' }),
  expiresAt: timestamp({ mode: 'date' }), // Optional expiration date
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const userNotifications = pgTable('portal_user_notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  type: varchar('type', { enum: ['MESSAGE'] }).notNull(),
  subType: varchar('sub_type', { enum: ['MENTIONED', 'NOTE_ADDED', 'NOTE_UPDATED', 'NOTE_DELETED'] }),
  initiatorId: varchar('initiator_id'),
  initiatorType: varchar('initiator_type', { enum: ['user', 'contact', 'team', 'system'] }),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  metadata: text(),
});

export const calendarFolder = pgTable('portal_calendar_folder', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  color: text().default('#4f46e5'),
  isDefault: boolean().default(false),
  visibility: text('visibility', { enum: ['PUBLIC', 'SHARED', 'PRIVATE'] })
    .notNull()
    .default('PRIVATE'),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const calendarEvent = pgTable('portal_calendar_event', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  folderId: text()
    .notNull()
    .references(() => calendarFolder.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  description: text(),
  location: text(),
  startAt: timestamp({ mode: 'date' }).notNull(),
  endAt: timestamp({ mode: 'date' }).notNull(),
  isAllDay: boolean().default(false),
  isPublic: boolean().default(false),
  recurrence: text(), // JSON string for recurrence rules
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const calendarEventShare = pgTable('portal_calendar_event_share', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text()
    .notNull()
    .references(() => calendarEvent.id, { onDelete: 'cascade' }),
  sharedWithUserId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  permission: text('permission', { enum: ['view', 'edit'] }).default('view'),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const calendarEventParticipant = pgTable('portal_calendar_event_participant', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text()
    .notNull()
    .references(() => calendarEvent.id, { onDelete: 'cascade' }),
  participantType: text('participantType', { enum: ['user', 'contact', 'external'] }).notNull(),
  participantId: text(), // userId or contactId for internal participants
  email: text(), // for external participants
  name: text(), // for external participants
  status: text('status', { enum: ['pending', 'accepted', 'declined', 'tentative'] }).default('pending'),
  role: text('role', { enum: ['organizer', 'required', 'optional'] }).default('required'),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const resourceContent = pgTable('portal_resource_content', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  title: text().notNull(),
  description: text(),
  content: text().notNull(),
  tags: text(), // JSON array of tags
  visibility: text('visibility', { enum: ['PUBLIC', 'SHARED', 'PRIVATE'] })
    .notNull()
    .default('PRIVATE'),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  updatedBy: text().references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const resourceContentShare = pgTable('portal_resource_content_share', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  resourceId: text()
    .notNull()
    .references(() => resourceContent.id, { onDelete: 'cascade' }),
  sharedWithUserId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  permission: text('permission', { enum: ['view', 'edit'] }).default('view'),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const resourceContentSendTrack = pgTable('portal_resource_content_send_track', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  resourceId: text()
    .notNull()
    .references(() => resourceContent.id, { onDelete: 'cascade' }),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  sentAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  sentBy: text()
    .notNull()
    .references(() => user.id),
  status: text('status', { enum: ['sent', 'delivered', 'read', 'failed'] }).default('sent'),
  metadata: text(), // JSON string for additional data like delivery channel, error messages, etc.
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const resourceEmails = pgTable('portal_resource_emails', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  title: text().notNull(),
  description: text(),
  subject: text().notNull(),
  content: text().notNull(),
  tags: text(), // JSON array of tags
  visibility: text('visibility', { enum: ['PUBLIC', 'SHARED', 'PRIVATE'] })
    .notNull()
    .default('PRIVATE'),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  updatedBy: text().references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const company = pgTable('portal_company', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  description: text(),
  industry: text(),
  size: text(), // company size/employee count
  website: text(),
  address: text(),
  city: text(),
  state: text(),
  country: text(),
  postalCode: text(),
  phone: text(),
  email: text(),
  status: text('status', { enum: ['active', 'inactive'] }).default('active'),
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const team = pgTable('portal_team', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  description: text(),
  companyId: text().references(() => company.id, { onDelete: 'cascade' }),
  leaderId: text().references(() => contact.id),
  subLeaderId: text().references(() => contact.id),
  referralId: text().references(() => contact.id),
  remarks: text(),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamContact = pgTable('portal_team_contact', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text()
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  assignedTo: text().references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamActivity = pgTable('portal_team_activity', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text()
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => user.id),
  type: text('type', {
    enum: [
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
    ],
  }).notNull(),
  subType: text('subType', {
    enum: [
      // Contact Management
      'CONTACT_CREATED',
      'CONTACT_UPDATED',
      'CONTACT_DELETED',

      // Status Changes
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
    ],
  }),
  initiatorType: text('initiatorType', { enum: ['user', 'system', 'team'] })
    .notNull()
    .default('system'),
  initiatorId: text(),
  description: text(),
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

// @ts-ignore - Self-referential table limitation
export const userTask = pgTable('portal_user_task', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  description: text(),
  content: text(), // Rich text content for detailed task documentation
  status: text('status', { enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'] }).default('todo'),
  priority: text('priority', { enum: ['urgent', 'high', 'medium', 'low'] }).default('medium'),
  dueDate: timestamp({ mode: 'date' }),
  completedAt: timestamp({ mode: 'date' }),
  assignedTo: text().references(() => user.id), // can be assigned to another user
  labels: text(), // JSON array of labels/tags
  attachments: text(), // JSON array of attachment URLs/metadata
  // @ts-ignore - Self-referential table limitation
  parentTaskId: text().references(() => userTask.id), // for subtasks
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamMeeting = pgTable('portal_team_meeting', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text()
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  description: text(),
  meetingDate: timestamp({ mode: 'date' }).notNull(),
  status: text('status', { enum: ['upcoming', 'completed', 'cancelled', 'no_show'] }).default('upcoming'),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const contactCustomField = pgTable('portal_contact_custom_field', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  label: text().notNull(),
  type: text('type', {
    enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect'],
  }).notNull(),
  options: text(), // JSON array for select/multiselect options
  required: boolean().default(false),
  defaultValue: text(),
  description: text(),
  isActive: boolean().default(true),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const contactCustomValue = pgTable('portal_contact_custom_value', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  fieldId: text()
    .notNull()
    .references(() => contactCustomField.id, { onDelete: 'cascade' }),
  value: text(),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamCustomField = pgTable('portal_team_custom_field', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  label: text().notNull(),
  type: text('type', {
    enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect'],
  }).notNull(),
  options: text(), // JSON array for select/multiselect options
  required: boolean().default(false),
  defaultValue: text(),
  description: text(),
  isActive: boolean().default(true),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamCustomValue = pgTable('portal_team_custom_value', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text()
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  fieldId: text()
    .notNull()
    .references(() => teamCustomField.id, { onDelete: 'cascade' }),
  value: text(),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const companyCustomField = pgTable('portal_company_custom_field', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  label: text().notNull(),
  type: text('type', {
    enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect'],
  }).notNull(),
  options: text(), // JSON array for select/multiselect options
  required: boolean().default(false),
  defaultValue: text(),
  description: text(),
  isActive: boolean().default(true),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const companyCustomValue = pgTable('portal_company_custom_value', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  companyId: text()
    .notNull()
    .references(() => company.id, { onDelete: 'cascade' }),
  fieldId: text()
    .notNull()
    .references(() => companyCustomField.id, { onDelete: 'cascade' }),
  value: text(),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const siteConfig = pgTable('portal_site_config', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  key: text('key', {
    enum: ['name', 'description', 'domain', 'supportEmailDomains', 'status', 'priority', 'source'],
  })
    .notNull()
    .unique(), // Unique key for the config
  value: text().notNull(), // Value stored as text (can be JSON for complex values)
  description: text(), // Optional description of what this config is for
  type: text('type', {
    enum: ['string', 'number', 'boolean', 'json', 'array'],
  })
    .notNull()
    .default('string'), // Type of the value for proper parsing
  isPublic: boolean().default(false), // Whether this config is publicly accessible
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});
