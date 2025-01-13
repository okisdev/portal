import { relations } from 'drizzle-orm/relations';
import { account, authenticator, contact, contactActivity, contactConversation, contactDeal, session, user } from './schema';

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
