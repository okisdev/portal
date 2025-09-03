import {
  boolean,
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

export const verification = pgTable('portal_verification', {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

export const user = pgTable(
  'portal_user',
  {
    id: text().primaryKey().notNull(),
    firstName: text(),
    lastName: text(),
    name: text(),
    email: text(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text(),
    role: text('role', {
      enum: ['ADMIN', 'SALES_MANAGER', 'SALES_ASSISTANT', 'MANAGER', 'USER'],
    }).default('USER'),
    timezone: text('timezone').notNull().default('Asia/Hong_Kong'),
    username: text().unique(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique('user_email_unique').on(table.email)]
);

export const account = pgTable(
  'portal_account',
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      mode: 'string',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      mode: 'string',
    }),
    scope: text(),
    idToken: text('id_token'),
    password: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
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
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    token: text().notNull().unique(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
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
  role: text('role', {
    enum: ['employee', 'manager', 'executive', 'other'],
  }).default('employee'),
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
  subType: varchar('sub_type', {
    enum: ['MENTIONED', 'NOTE_ADDED', 'NOTE_UPDATED', 'NOTE_DELETED'],
  }),
  initiatorId: varchar('initiator_id'),
  initiatorType: varchar('initiator_type', {
    enum: ['user', 'contact', 'team', 'system'],
  }),
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

export const calendarEventParticipant = pgTable(
  'portal_calendar_event_participant',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text()
      .notNull()
      .references(() => calendarEvent.id, { onDelete: 'cascade' }),
    participantType: text('participantType', {
      enum: ['user', 'contact', 'external'],
    }).notNull(),
    participantId: text(), // userId or contactId for internal participants
    email: text(), // for external participants
    name: text(), // for external participants
    status: text('status', {
      enum: ['pending', 'accepted', 'declined', 'tentative'],
    }).default('pending'),
    role: text('role', { enum: ['organizer', 'required', 'optional'] }).default(
      'required'
    ),
    createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  }
);

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

export const resourceContentSendTrack = pgTable(
  'portal_resource_content_send_track',
  {
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
    status: text('status', {
      enum: ['sent', 'delivered', 'read', 'failed'],
    }).default('sent'),
    metadata: text(), // JSON string for additional data like delivery channel, error messages, etc.
    createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  }
);

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

// @ts-expect-error - Self-referential table limitation
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
  status: text('status', {
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
  }).default('todo'),
  priority: text('priority', {
    enum: ['urgent', 'high', 'medium', 'low'],
  }).default('medium'),
  dueDate: timestamp({ mode: 'date' }),
  completedAt: timestamp({ mode: 'date' }),
  assignedTo: text().references(() => user.id), // can be assigned to another user
  labels: text(), // JSON array of labels/tags
  attachments: text(), // JSON array of attachment URLs/metadata
  // @ts-expect-error - Self-referential table limitation
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
  status: text('status', {
    enum: ['upcoming', 'completed', 'cancelled', 'no_show'],
  }).default('upcoming'),
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
    enum: [
      'name',
      'description',
      'domain',
      'supportEmailDomains',
      'status',
      'priority',
      'source',
    ],
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

export const userApiKey = pgTable(
  'portal_user_api_key',
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text().notNull(), // Human-readable name for the API key (e.g., "CRM Integration", "Mobile App")
    keyHash: text().notNull().unique(), // Hashed version of the API key for secure storage
    keyPrefix: text().notNull(), // First few characters for identification (e.g., "pk_")
    permissions: text(), // JSON array of permissions/scopes (e.g., ["read:contacts", "write:contacts", "read:calendar"])
    lastUsedAt: timestamp({ mode: 'date' }), // Track when the key was last used
    lastUsedIp: text('last_used_ip'), // Track IP address of last usage
    expiresAt: timestamp({ mode: 'date' }), // Optional expiration date
    usageCount: integer().default(0), // Track number of times used
    metadata: text(), // JSON string for additional data (rate limits, etc.)
    createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'portal_user_api_key_userId_user_id_fk',
    }).onDelete('cascade'),
  ]
);
