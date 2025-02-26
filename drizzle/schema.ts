import { boolean, foreignKey, integer, pgTable, serial, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

export const verificationToken = pgTable('portal_verificationToken', {
  identifier: text().notNull(),
  token: text().notNull(),
  expires: timestamp({ mode: 'string' }).notNull(),
});

export const user = pgTable(
  'portal_user',
  {
    id: text().primaryKey().notNull(),
    firstName: text(),
    lastName: text(),
    name: text(),
    email: text(),
    emailVerified: timestamp({ mode: 'string' }),
    password: text(),
    image: text(),
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
    username: text().unique(),
  },
  (table) => [unique('user_email_unique').on(table.email)]
);

export const account = pgTable(
  'portal_account',
  {
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text(),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'portal_account_userId_user_id_fk',
    }).onDelete('cascade'),
  ]
);

export const authenticator = pgTable(
  'portal_authenticator',
  {
    credentialId: text().notNull(),
    userId: text().notNull(),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer().notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: boolean().notNull(),
    transports: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'portal_authenticator_userId_user_id_fk',
    }).onDelete('cascade'),
    unique('portal_authenticator_credentialID_unique').on(table.credentialId),
  ]
);

export const session = pgTable(
  'portal_session',
  {
    sessionToken: text().primaryKey().notNull(),
    userId: text().notNull(),
    expires: timestamp({ mode: 'string' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'portal_session_userId_user_id_fk',
    }).onDelete('cascade'),
  ]
);

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
  status: text('status', { enum: ['lead', 'appointment', 'pitch', 'trial', 'final', 'closed', 'junk'] })
    .notNull()
    .default('lead'),
  source: text(),
  assignedTo: text().references(() => user.id),
  stripeCustomerId: text(),
  createdBy: text().references(() => user.id),
  joinedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  lastContactedAt: timestamp({ mode: 'date' }),
  nextFollowUpAt: timestamp({ mode: 'date' }),
  priority: text('priority', { enum: ['urgent', 'high', 'medium', 'low'] }).default('medium'),
  workExperience: text(),
  currentRole: text(),
  industry: text(),
  skills: text(),
  externalId: text(),
});

export const companyContact = pgTable('portal_companyContact', {
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

export const contactDeal = pgTable('portal_contactDeal', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  value: integer().notNull(), // in cents
  status: text().notNull().default('open'), // 'open', 'won', 'lost'
  expectedCloseDate: timestamp({ mode: 'date' }),
  actualCloseDate: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const contactActivity = pgTable('portal_contactActivity', {
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

export const paymentTrack = pgTable('portal_paymentTrack', {
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

export const subscriptionCoupon = pgTable('portal_subscriptionCoupon', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  code: text().notNull().unique(),
  discountPercent: integer().notNull(),
  maxUses: integer(),
  usedCount: integer().default(0),
  expiresAt: timestamp({ mode: 'date' }),
  createdBy: text().references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  isActive: boolean().default(true),
  company: text(),
  source: text(),
  planId: text('plan_id').notNull(),
  stripeId: text('stripe_id'),
});

export const subscriptionPlan = pgTable('portal_subscriptionPlan', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  description: text(),
  stripePriceId: text().notNull(),
  price: integer().notNull(), // in cents
  interval: text('interval', { enum: ['month', 'year'] }).notNull(),
  features: text(), // JSON string of features
  isActive: boolean().default(true),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const userNotifications = pgTable('portal_userNotifications', {
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

export const calendarFolder = pgTable('portal_calendarFolder', {
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

export const calendarEvent = pgTable('portal_calendarEvent', {
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

export const calendarEventShare = pgTable('portal_calendarEventShare', {
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

export const calendarEventParticipant = pgTable('portal_calendarEventParticipant', {
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

export const resourceContent = pgTable('portal_resourceContent', {
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

export const resourceContentShare = pgTable('portal_resourceContentShare', {
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

export const resourceContentSendTrack = pgTable('portal_resourceContentSendTrack', {
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

export const resourceEmails = pgTable('portal_resourceEmails', {
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

export const marketingCampaign = pgTable('portal_marketingCampaign', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  campaignCode: text().notNull().unique(),
  description: text(),
  type: text('type', { enum: ['email', 'social', 'event', 'referral', 'other'] }).notNull(),
  status: text('status', { enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'] })
    .notNull()
    .default('draft'),
  metrics: text(),
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
  campaignCode: text(),
  remarks: text(),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamContact = pgTable('portal_teamContact', {
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

export const teamActivity = pgTable('portal_teamActivity', {
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
export const userTask = pgTable('portal_userTask', {
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

export const teamMeeting = pgTable('portal_teamMeeting', {
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

export const contactCampaign = pgTable('portal_contactCampaign', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  campaignCode: text()
    .notNull()
    .references(() => marketingCampaign.campaignCode, { onDelete: 'cascade' }),
  joinedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const contactCustomField = pgTable('portal_contactCustomField', {
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

export const contactCustomValue = pgTable('portal_contactCustomValue', {
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

export const teamCustomField = pgTable('portal_teamCustomField', {
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

export const teamCustomValue = pgTable('portal_teamCustomValue', {
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

export const companyCustomField = pgTable('portal_companyCustomField', {
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

export const companyCustomValue = pgTable('portal_companyCustomValue', {
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

export const siteConfig = pgTable('portal_siteConfig', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  key: text('key', {
    enum: ['name', 'description', 'domain', 'supportEmailDomains'],
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
