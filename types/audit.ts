export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type AuditResource =
  | 'account'
  | 'admin'
  | 'api-key'
  | 'calendar'
  | 'company'
  | 'contact'
  | 'resource'
  | 'site'
  | 'task'
  | 'team'
  | 'user'
  | 'notification';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  routerName: string;
  procedureName: string;
  inputData?: string; // JSON string
  previousData?: string; // JSON string
  newData?: string; // JSON string
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus;
  errorMessage?: string;
  duration?: number; // milliseconds
  metadata?: string; // JSON string
  createdAt: Date;
}

export interface AuditLogEntryWithUser extends AuditLogEntry {
  user: {
    id: string;
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Mapping of procedure names to their corresponding actions and resources
export const PROCEDURE_MAPPING: Record<
  string,
  { action: AuditAction; resource: AuditResource }
> = {
  // Account
  updateMe: { action: 'UPDATE', resource: 'account' },
  updateTimezone: { action: 'UPDATE', resource: 'account' },

  // Admin
  createUser: { action: 'CREATE', resource: 'admin' },
  updateUser: { action: 'UPDATE', resource: 'admin' },
  deleteUser: { action: 'DELETE', resource: 'admin' },
  deleteApiKey: { action: 'DELETE', resource: 'api-key' },

  // Calendar
  createFolder: { action: 'CREATE', resource: 'calendar' },
  createEvent: { action: 'CREATE', resource: 'calendar' },
  updateEvent: { action: 'UPDATE', resource: 'calendar' },
  deleteEvent: { action: 'DELETE', resource: 'calendar' },
  updateFolder: { action: 'UPDATE', resource: 'calendar' },
  deleteFolder: { action: 'DELETE', resource: 'calendar' },
  createAppointment: { action: 'CREATE', resource: 'calendar' },

  // Company
  createCompany: { action: 'CREATE', resource: 'company' },
  updateCompany: { action: 'UPDATE', resource: 'company' },
  deleteCompany: { action: 'DELETE', resource: 'company' },
  updateCompanyStatus: { action: 'UPDATE', resource: 'company' },
  addCompanyContact: { action: 'CREATE', resource: 'company' },
  removeCompanyContact: { action: 'DELETE', resource: 'company' },

  // Contact
  createContact: { action: 'CREATE', resource: 'contact' },
  updateContactRemark: { action: 'UPDATE', resource: 'contact' },
  deleteContact: { action: 'DELETE', resource: 'contact' },
  createContactActivity: { action: 'CREATE', resource: 'contact' },
  deleteContactActivity: { action: 'DELETE', resource: 'contact' },
  updateContact: { action: 'UPDATE', resource: 'contact' },
  sendEmail: { action: 'CREATE', resource: 'contact' },
  createContacts: { action: 'CREATE', resource: 'contact' },

  // Resource
  createContent: { action: 'CREATE', resource: 'resource' },
  updateContent: { action: 'UPDATE', resource: 'resource' },
  deleteContent: { action: 'DELETE', resource: 'resource' },
  shareContent: { action: 'UPDATE', resource: 'resource' },
  removeShare: { action: 'DELETE', resource: 'resource' },
  createEmail: { action: 'CREATE', resource: 'resource' },
  updateEmail: { action: 'UPDATE', resource: 'resource' },
  deleteEmail: { action: 'DELETE', resource: 'resource' },
  createContentSendTrack: { action: 'CREATE', resource: 'resource' },

  // Site
  addStatus: { action: 'CREATE', resource: 'site' },
  removeStatus: { action: 'DELETE', resource: 'site' },
  addPriority: { action: 'CREATE', resource: 'site' },
  removePriority: { action: 'DELETE', resource: 'site' },
  addSource: { action: 'CREATE', resource: 'site' },
  removeSource: { action: 'DELETE', resource: 'site' },
  updateConfig: { action: 'UPDATE', resource: 'site' },
  deleteConfig: { action: 'DELETE', resource: 'site' },
  updateStatus: { action: 'UPDATE', resource: 'site' },
  reorderStatus: { action: 'UPDATE', resource: 'site' },
  updatePriority: { action: 'UPDATE', resource: 'site' },
  reorderPriority: { action: 'UPDATE', resource: 'site' },
  updateSource: { action: 'UPDATE', resource: 'site' },
  reorderSource: { action: 'UPDATE', resource: 'site' },

  // API Key

  // Task
  create: { action: 'CREATE', resource: 'task' },
  update: { action: 'UPDATE', resource: 'task' },
  delete: { action: 'DELETE', resource: 'task' },

  // Team
  createTeam: { action: 'CREATE', resource: 'team' },
  assignContactToTeam: { action: 'UPDATE', resource: 'team' },
  removeContactFromTeam: { action: 'DELETE', resource: 'team' },
  updateTeam: { action: 'UPDATE', resource: 'team' },
  updateTeamRemarks: { action: 'UPDATE', resource: 'team' },
  createTeamActivity: { action: 'CREATE', resource: 'team' },
  createTeamMeeting: { action: 'CREATE', resource: 'team' },
  deleteTeamMeeting: { action: 'DELETE', resource: 'team' },
  deleteTeamActivity: { action: 'DELETE', resource: 'team' },
  addTeamContact: { action: 'CREATE', resource: 'team' },
  deleteTeam: { action: 'DELETE', resource: 'team' },

  // User/Notification
  markNotificationAsRead: { action: 'UPDATE', resource: 'notification' },
  markAllNotificationsAsRead: { action: 'UPDATE', resource: 'notification' },
  createNotification: { action: 'CREATE', resource: 'notification' },

  // API v1 procedures
  'v1.contact.upload': { action: 'CREATE', resource: 'contact' },
};

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  routerName: string;
  procedureName: string;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  routerName?: string;
  procedureName?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}
