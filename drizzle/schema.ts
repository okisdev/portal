import { boolean, foreignKey, integer, pgTable, serial, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

export const verificationToken = pgTable('verificationToken', {
  identifier: text().notNull(),
  token: text().notNull(),
  expires: timestamp({ mode: 'string' }).notNull(),
});

export const user = pgTable(
  'user',
  {
    id: text().primaryKey().notNull(),
    firstName: text(),
    lastName: text(),
    name: text(),
    email: text(),
    emailVerified: timestamp({ mode: 'string' }),
    password: text(),
    image: text(),
    role: text('role', { enum: ['ADMIN', 'SALES', 'MANAGER', 'USER'] }).default('USER'),
    username: text().unique(),
  },
  (table) => [unique('user_email_unique').on(table.email)]
);

export const account = pgTable(
  'account',
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
      name: 'account_userId_user_id_fk',
    }).onDelete('cascade'),
  ]
);

export const authenticator = pgTable(
  'authenticator',
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
      name: 'authenticator_userId_user_id_fk',
    }).onDelete('cascade'),
    unique('authenticator_credentialID_unique').on(table.credentialId),
  ]
);

export const session = pgTable(
  'session',
  {
    sessionToken: text().primaryKey().notNull(),
    userId: text().notNull(),
    expires: timestamp({ mode: 'string' }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'session_userId_user_id_fk',
    }).onDelete('cascade'),
  ]
);

export const contact = pgTable('contact', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text().notNull(),
  phone: text(),
  gender: text(),
  company: text(),
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
  assignedTo: text().references(() => user.id), // sales rep or account manager
  stripeCustomerId: text(), // for payment integration
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  lastContactedAt: timestamp({ mode: 'date' }),
  priority: text('priority', { enum: ['urgent', 'high', 'medium', 'low'] }).default('medium'),
  workExperience: text(), // years of experience
  currentRole: text(), // current job role
  industry: text(), // industry they work in
  skills: text(), // comma-separated list of skills
});

export const contactDeal = pgTable('contactDeal', {
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

export const contactActivity = pgTable('contactActivity', {
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
      // Contact Management
      'CONTACT_CREATED',
      'CONTACT_UPDATED',
      'CONTACT_DELETED',

      // Status Changes
      'STATUS_CHANGED',
      'PRIORITY_CHANGED',

      // Engagement
      'MEETING_SCHEDULED',
      'MEETING_UPDATED',
      'MEETING_CANCELLED',
      'CALL_LOGGED',
      'EMAIL_SENT',
      'NOTE_ADDED',

      // Team Management
      'TEAM_ASSIGNED',
      'TEAM_REMOVED',

      // Deal Management
      'DEAL_CREATED',
      'DEAL_UPDATED',
      'DEAL_CLOSED',

      // Payment
      'PAYMENT_LINK_CLICKED',
      'PAYMENT_COMPLETED',
    ],
  }).notNull(),
  initiatorType: text('initiatorType', { enum: ['user', 'contact', 'system'] })
    .notNull()
    .default('system'),
  initiatorId: text('initiatorId'),
  title: text().notNull(),
  description: text(),
  metadata: text(), // JSON string for additional data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const paymentTrack = pgTable('paymentTrack', {
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

export const subscriptionCoupon = pgTable('subscriptionCoupon', {
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

export const subscriptionPlan = pgTable('subscriptionPlan', {
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

export const userNotifications = pgTable('userNotifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  type: varchar('type').notNull(),
  title: varchar('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const calendarFolder = pgTable('calendarFolder', {
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
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const calendarEvent = pgTable('calendarEvent', {
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

export const calendarEventShare = pgTable('calendarEventShare', {
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

export const calendarEventParticipant = pgTable('calendarEventParticipant', {
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

export const resourceContent = pgTable('resourceContent', {
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

export const resourceContentShare = pgTable('resourceContentShare', {
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

export const resourceEmails = pgTable('resourceEmails', {
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

export const marketingCampaign = pgTable('marketingCampaign', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  campaignCode: text().unique(),
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

export const contactCampaign = pgTable('contactCampaign', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  campaignId: text()
    .notNull()
    .references(() => marketingCampaign.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'engaged', 'converted', 'bounced', 'unsubscribed'] })
    .notNull()
    .default('pending'),
  signupDate: timestamp({ mode: 'date' }).notNull().defaultNow(),
  conversionDate: timestamp({ mode: 'date' }),
  source: text(), // how they joined the campaign
  metadata: text(), // JSON string for additional tracking data
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const team = pgTable('team', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  description: text(),
  leaderId: text().references(() => contact.id),
  subLeaderId: text().references(() => contact.id),
  referralId: text().references(() => contact.id),
  campaignCode: text().unique(),
  remarks: text(),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const teamContact = pgTable('teamContact', {
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

export const teamActivity = pgTable('teamActivity', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text()
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => user.id), // who performed the activity
  type: text().notNull(), // 'meeting_created', 'meeting_updated', 'member_added', 'member_removed', 'remark_updated', 'team_updated', etc.
  initiatorType: text().notNull().default('system'), // 'user', 'system'
  initiatorId: text(), // id of the initiator
  title: text().notNull(), // e.g., "Added new team member"
  description: text(), // optional detailed description
  metadata: text(), // JSON string for additional data specific to activity type
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

// @ts-ignore - Self-referential table limitation
export const userTask = pgTable('userTask', {
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

export const teamMeeting = pgTable('teamMeeting', {
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
