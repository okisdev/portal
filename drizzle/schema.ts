import { boolean, foreignKey, integer, pgTable, serial, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

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
  gender: text(), // 'male', 'female', 'other'
  company: text(),
  jobTitle: text(),
  address: text(),
  city: text(),
  state: text(),
  country: text(),
  postalCode: text(),
  status: text('status', { enum: ['lead', 'prospect', 'customer', 'churned', 'opportunity'] })
    .notNull()
    .default('lead'),
  source: text(),
  // 'social_media' - From social media platforms
  // 'referral' - Referred by existing customer
  // 'website' - Direct website visit
  // 'cold_outreach' - From cold calling/emailing
  // 'event' - From trade shows or events
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

export const contactConversation = pgTable('contactConversation', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  contactId: text()
    .notNull()
    .references(() => contact.id, { onDelete: 'cascade' }),
  userId: text()
    .notNull()
    .references(() => user.id), // who made the remark
  content: text().notNull(),
  type: text().default('note'), // 'note', 'call', 'meeting', 'email'
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
    .references(() => user.id), // who performed the activity
  type: text().notNull(), // 'call', 'email', 'meeting', 'note', 'status_change', 'deal_created', 'deal_updated', 'payment_link_clicked', etc.
  initiatorType: text().notNull().default('system'), // 'user', 'contact', 'system'
  initiatorId: text(), // id of the initiator
  title: text().notNull(), // e.g., "Called client about new proposal"
  description: text(), // optional detailed description
  metadata: text(), // JSON string for additional data specific to activity type
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

export const notifications = pgTable('notifications', {
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

export const teamRemark = pgTable('teamRemark', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text()
    .notNull()
    .references(() => team.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  createdBy: text()
    .notNull()
    .references(() => user.id),
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
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

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('teamId').references(() => team.id, { onDelete: 'cascade' }),
  contactId: uuid('contactId').references(() => contact.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});
