import { relations } from 'drizzle-orm/relations';
import {
  account,
  authenticator,
  calendarEvent,
  calendarEventParticipant,
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
  team,
  teamContact,
  teamMember,
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
  eventParticipations: many(calendarEventParticipant),
  teams: many(teamMember),
  createdTeams: many(team, { relationName: 'teamCreator' }),
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
  eventParticipations: many(calendarEventParticipant),
  teams: many(teamContact),
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
  participants: many(calendarEventParticipant),
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

export const calendarEventParticipantRelations = relations(calendarEventParticipant, ({ one }) => ({
  event: one(calendarEvent, {
    fields: [calendarEventParticipant.eventId],
    references: [calendarEvent.id],
  }),
  user: one(user, {
    fields: [calendarEventParticipant.participantId],
    references: [user.id],
  }),
  contact: one(contact, {
    fields: [calendarEventParticipant.participantId],
    references: [contact.id],
  }),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  creator: one(user, {
    fields: [team.createdBy],
    references: [user.id],
  }),
  members: many(teamMember),
  contacts: many(teamContact),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const teamContactRelations = relations(teamContact, ({ one }) => ({
  team: one(team, {
    fields: [teamContact.teamId],
    references: [team.id],
  }),
  contact: one(contact, {
    fields: [teamContact.contactId],
    references: [contact.id],
  }),
  assignedUser: one(user, {
    fields: [teamContact.assignedTo],
    references: [user.id],
  }),
}));
