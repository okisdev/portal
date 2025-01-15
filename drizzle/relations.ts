import { relations } from 'drizzle-orm/relations';
import {
  account,
  authenticator,
  calendarEvent,
  calendarEventShare,
  calendarFolder,
  contact,
  contactActivity,
  contactConversation,
  contactDeal,
  notifications,
  paymentTrack,
  session,
  subscriptionCoupon,
  user,
} from './schema';

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  authenticators: many(authenticator),
  sessions: many(session),
  calendarFolders: many(calendarFolder),
  calendarEvents: many(calendarEvent),
  sharedCalendarEvents: many(calendarEventShare, { relationName: 'sharedWithUser' }),
}));

export const authenticatorRelations = relations(authenticator, ({ one }) => ({
  user: one(user, {
    fields: [authenticator.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const contactRelations = relations(contact, ({ many, one }) => ({
  remarks: many(contactConversation),
  deals: many(contactDeal),
  activities: many(contactActivity),
  payments: many(paymentTrack),
  assignedUser: one(user, {
    fields: [contact.assignedTo],
    references: [user.id],
  }),
}));

export const contactConversationRelations = relations(contactConversation, ({ one }) => ({
  contact: one(contact, {
    fields: [contactConversation.contactId],
    references: [contact.id],
  }),
  user: one(user, {
    fields: [contactConversation.userId],
    references: [user.id],
  }),
}));

export const contactDealRelations = relations(contactDeal, ({ one }) => ({
  contact: one(contact, {
    fields: [contactDeal.contactId],
    references: [contact.id],
  }),
}));

export const contactActivityRelations = relations(contactActivity, ({ one }) => ({
  contact: one(contact, {
    fields: [contactActivity.contactId],
    references: [contact.id],
  }),
  user: one(user, {
    fields: [contactActivity.userId],
    references: [user.id],
  }),
}));

export const paymentTrackRelations = relations(paymentTrack, ({ one }) => ({
  contact: one(contact, {
    fields: [paymentTrack.contactId],
    references: [contact.id],
  }),
  user: one(user, {
    fields: [paymentTrack.userId],
    references: [user.id],
  }),
}));

export const subscriptionCouponRelations = relations(subscriptionCoupon, ({ one }) => ({
  creator: one(user, {
    fields: [subscriptionCoupon.createdBy],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

export const calendarFolderRelations = relations(calendarFolder, ({ one, many }) => ({
  user: one(user, {
    fields: [calendarFolder.userId],
    references: [user.id],
  }),
  events: many(calendarEvent),
}));

export const calendarEventRelations = relations(calendarEvent, ({ one, many }) => ({
  user: one(user, {
    fields: [calendarEvent.userId],
    references: [user.id],
  }),
  folder: one(calendarFolder, {
    fields: [calendarEvent.folderId],
    references: [calendarFolder.id],
  }),
  shares: many(calendarEventShare),
}));

export const calendarEventShareRelations = relations(calendarEventShare, ({ one }) => ({
  event: one(calendarEvent, {
    fields: [calendarEventShare.eventId],
    references: [calendarEvent.id],
  }),
  sharedWithUser: one(user, {
    fields: [calendarEventShare.sharedWithUserId],
    references: [user.id],
  }),
}));
