import { relations } from 'drizzle-orm/relations';
import {
  account,
  authenticator,
  calendarEvent,
  calendarEventParticipant,
  calendarEventShare,
  calendarFolder,
  company,
  companyContact,
  companyCustomField,
  companyCustomValue,
  contact,
  contactActivity,
  contactCampaign,
  contactCustomField,
  contactCustomValue,
  contactDeal,
  marketingCampaign,
  paymentTrack,
  resourceContent,
  resourceContentSendTrack,
  resourceContentShare,
  resourceEmails,
  session,
  subscriptionCoupon,
  team,
  teamActivity,
  teamContact,
  teamCustomField,
  teamCustomValue,
  teamMeeting,
  user,
  userNotifications,
  userTask,
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
  createdTeams: many(team, { relationName: 'teamCreator' }),
  tasks: many(userTask, { relationName: 'userTasks' }),
  assignedTasks: many(userTask, { relationName: 'assignedTasks' }),
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
  deals: many(contactDeal),
  activities: many(contactActivity),
  payments: many(paymentTrack),
  assignedUser: one(user, {
    fields: [contact.assignedTo],
    references: [user.id],
  }),
  company: one(company, {
    fields: [contact.companyId],
    references: [company.id],
  }),
  companies: many(companyContact),
  campaigns: many(contactCampaign),
  eventParticipations: many(calendarEventParticipant),
  teams: many(teamContact),
  leadingTeams: many(team, { relationName: 'teamLeader' }),
  subLeadingTeams: many(team, { relationName: 'teamSubLeader' }),
  referralTeams: many(team, { relationName: 'teamReferral' }),
  receivedContent: many(resourceContentSendTrack),
  customValues: many(contactCustomValue),
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

export const notificationRelations = relations(userNotifications, ({ one }) => ({
  user: one(user, {
    fields: [userNotifications.userId],
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

export const resourceContentRelations = relations(resourceContent, ({ one, many }) => ({
  creator: one(user, {
    fields: [resourceContent.createdBy],
    references: [user.id],
  }),
  updater: one(user, {
    fields: [resourceContent.updatedBy],
    references: [user.id],
  }),
  shares: many(resourceContentShare),
  sendTracks: many(resourceContentSendTrack),
}));

export const resourceContentShareRelations = relations(resourceContentShare, ({ one }) => ({
  resource: one(resourceContent, {
    fields: [resourceContentShare.resourceId],
    references: [resourceContent.id],
  }),
  sharedWithUser: one(user, {
    fields: [resourceContentShare.sharedWithUserId],
    references: [user.id],
  }),
}));

export const resourceEmailsRelations = relations(resourceEmails, ({ one }) => ({
  creator: one(user, {
    fields: [resourceEmails.createdBy],
    references: [user.id],
  }),
  updater: one(user, {
    fields: [resourceEmails.updatedBy],
    references: [user.id],
  }),
}));

export const marketingCampaignRelations = relations(marketingCampaign, ({ one, many }) => ({
  creator: one(user, {
    fields: [marketingCampaign.createdBy],
    references: [user.id],
  }),
  updater: one(user, {
    fields: [marketingCampaign.updatedBy],
    references: [user.id],
  }),
  contacts: many(contactCampaign),
}));

export const contactCampaignRelations = relations(contactCampaign, ({ one }) => ({
  contact: one(contact, {
    fields: [contactCampaign.contactId],
    references: [contact.id],
  }),
  campaign: one(marketingCampaign, {
    fields: [contactCampaign.campaignCode],
    references: [marketingCampaign.campaignCode],
  }),
}));

export const companyRelations = relations(company, ({ many }) => ({
  teams: many(team),
  contacts: many(companyContact),
  customValues: many(companyCustomValue),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  company: one(company, {
    fields: [team.companyId],
    references: [company.id],
  }),
  creator: one(user, {
    fields: [team.createdBy],
    references: [user.id],
  }),
  teamContacts: many(teamContact),
  activities: many(teamActivity),
  leader: one(contact, {
    fields: [team.leaderId],
    references: [contact.id],
  }),
  subLeader: one(contact, {
    fields: [team.subLeaderId],
    references: [contact.id],
  }),
  referral: one(contact, {
    fields: [team.referralId],
    references: [contact.id],
  }),
  customValues: many(teamCustomValue),
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

export const teamActivityRelations = relations(teamActivity, ({ one }) => ({
  team: one(team, {
    fields: [teamActivity.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamActivity.userId],
    references: [user.id],
  }),
}));

export const teamPitchingRelations = relations(teamMeeting, ({ one }) => ({
  team: one(team, {
    fields: [teamMeeting.teamId],
    references: [team.id],
  }),
  creator: one(user, {
    fields: [teamMeeting.createdBy],
    references: [user.id],
  }),
}));

export const userTaskRelations = relations(userTask, ({ one, many }) => ({
  user: one(user, {
    fields: [userTask.userId],
    references: [user.id],
  }),
  assignee: one(user, {
    fields: [userTask.assignedTo],
    references: [user.id],
  }),
  parentTask: one(userTask, {
    fields: [userTask.parentTaskId],
    references: [userTask.id],
  }),
  subtasks: many(userTask, { relationName: 'subtasks' }),
}));

export const resourceContentSendTrackRelations = relations(resourceContentSendTrack, ({ one }) => ({
  resource: one(resourceContent, {
    fields: [resourceContentSendTrack.resourceId],
    references: [resourceContent.id],
  }),
  contact: one(contact, {
    fields: [resourceContentSendTrack.contactId],
    references: [contact.id],
  }),
  sender: one(user, {
    fields: [resourceContentSendTrack.sentBy],
    references: [user.id],
  }),
}));

export const companyContactRelations = relations(companyContact, ({ one }) => ({
  company: one(company, {
    fields: [companyContact.companyId],
    references: [company.id],
  }),
  contact: one(contact, {
    fields: [companyContact.contactId],
    references: [contact.id],
  }),
}));

export const contactCustomFieldRelations = relations(contactCustomField, ({ many }) => ({
  values: many(contactCustomValue),
}));

export const contactCustomValueRelations = relations(contactCustomValue, ({ one }) => ({
  contact: one(contact, {
    fields: [contactCustomValue.contactId],
    references: [contact.id],
  }),
  field: one(contactCustomField, {
    fields: [contactCustomValue.fieldId],
    references: [contactCustomField.id],
  }),
}));

export const teamCustomFieldRelations = relations(teamCustomField, ({ many }) => ({
  values: many(teamCustomValue),
}));

export const teamCustomValueRelations = relations(teamCustomValue, ({ one }) => ({
  team: one(team, {
    fields: [teamCustomValue.teamId],
    references: [team.id],
  }),
  field: one(teamCustomField, {
    fields: [teamCustomValue.fieldId],
    references: [teamCustomField.id],
  }),
}));

export const companyCustomFieldRelations = relations(companyCustomField, ({ many }) => ({
  values: many(companyCustomValue),
}));

export const companyCustomValueRelations = relations(companyCustomValue, ({ one }) => ({
  company: one(company, {
    fields: [companyCustomValue.companyId],
    references: [company.id],
  }),
  field: one(companyCustomField, {
    fields: [companyCustomValue.fieldId],
    references: [companyCustomField.id],
  }),
}));
