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

export const companyContact = pgTable('companyContact', {
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
      'NOTE_ADDED',
      'REMARK_UPDATED',

      // Team Management
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
  metadata: text('metadata'),
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
  visibility: text('visibility', { enum: ['PUBLIC', 'SHARED', 'PRIVATE'] })
    .notNull()
    .default('PRIVATE'),
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

export const resourceContentSendTrack = pgTable('resourceContentSendTrack', {
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

export const company = pgTable('company', {
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

export const team = pgTable('team', {
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
    .references(() => user.id),
  type: text('type', {
    enum: [
      'TEAM', // Team-related activities
      'MEMBER', // Member-related activities
      'MEETING', // Meeting-related activities
      'GOAL', // Goal-related activities
      'PERFORMANCE', // Performance-related activities
      'ENGAGEMENT', // Engagement activities
      'CAMPAIGN', // Campaign-related activities
      'PAYMENT', // Payment-related activities
    ],
  }).notNull(),
  subType: text('subType', {
    enum: [
      // Team Management
      'TEAM_CREATED',
      'TEAM_UPDATED',
      'TEAM_ARCHIVED',
      'TEAM_ACTIVATED',

      // Member Management
      'MEMBER_ADDED',
      'MEMBER_REMOVED',
      'MEMBER_ROLE_UPDATED',
      'LEADER_ASSIGNED',
      'SUBLEADER_ASSIGNED',
      'REFERRAL_ASSIGNED',

      // Meeting Management
      'MEETING_SCHEDULED',
      'MEETING_UPDATED',
      'MEETING_CANCELLED',
      'MEETING_COMPLETED',
      'MEETING_NO_SHOW',

      // Goal Management
      'GOAL_SET',
      'GOAL_UPDATED',
      'GOAL_ACHIEVED',
      'GOAL_MISSED',

      // Performance Tracking
      'PERFORMANCE_REVIEWED',
      'KPI_UPDATED',
      'MILESTONE_REACHED',
      'ACHIEVEMENT_UNLOCKED',

      // Engagement
      'NOTE_ADDED',
      'REMARK_UPDATED',
      'DOCUMENT_SHARED',
      'TASK_ASSIGNED',
      'FEEDBACK_PROVIDED',

      // Campaign Management
      'CAMPAIGN_STARTED',
      'CAMPAIGN_UPDATED',
      'CAMPAIGN_COMPLETED',
      'CAMPAIGN_CANCELLED',

      // Payment/Financial
      'COMMISSION_RECORDED',
      'BONUS_AWARDED',
      'PAYMENT_PROCESSED',
      'REVENUE_UPDATED',
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

export const contactCampaign = pgTable('contactCampaign', {
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

export const contactCustomField = pgTable('contactCustomField', {
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

export const contactCustomValue = pgTable('contactCustomValue', {
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

export const teamCustomField = pgTable('teamCustomField', {
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

export const teamCustomValue = pgTable('teamCustomValue', {
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

export const companyCustomField = pgTable('companyCustomField', {
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

export const companyCustomValue = pgTable('companyCustomValue', {
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

export const siteConfig = pgTable('siteConfig', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  key: text('key', {
    enum: ['name', 'description'],
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
