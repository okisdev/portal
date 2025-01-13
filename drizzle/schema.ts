import { boolean, foreignKey, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

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
  status: text().notNull().default('lead'), // 'lead' - Initial contact, needs qualification
  // 'prospect' - Qualified lead, actively engaged
  // 'customer' - Current paying customer
  // 'churned' - Previous customer, no longer active
  // 'opportunity' - Qualified lead with high potential
  source: text(), // 'social_media' - From social media platforms
  // 'referral' - Referred by existing customer
  // 'website' - Direct website visit
  // 'cold_outreach' - From cold calling/emailing
  // 'event' - From trade shows or events
  assignedTo: text().references(() => user.id), // sales rep or account manager
  stripeCustomerId: text(), // for payment integration
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
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
  type: text().notNull(), // 'call', 'email', 'meeting', 'note', 'status_change', 'deal_created', 'deal_updated', etc.
  title: text().notNull(), // e.g., "Called client about new proposal"
  description: text(), // optional detailed description
  metadata: text(), // JSON string for additional data specific to activity type
  createdAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date' }).notNull().defaultNow(),
});
