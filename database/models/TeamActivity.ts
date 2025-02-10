import mongoose, { Schema, type Document } from 'mongoose';

export type TeamActivityType = 'CONTACT' | 'STATUS' | 'DATE' | 'TEAM' | 'CAMPAIGN' | 'DEAL' | 'PAYMENT' | 'ENGAGEMENT';

export type TeamActivitySubType =
  | 'CONTACT_CREATED'
  | 'CONTACT_UPDATED'
  | 'CONTACT_DELETED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'LAST_CONTACTED'
  | 'NEXT_FOLLOW_UP'
  | 'MEETING_SCHEDULED'
  | 'MEETING_UPDATED'
  | 'MEETING_CANCELLED'
  | 'CALL_LOGGED'
  | 'EMAIL_SENT'
  | 'EMAIL_SCHEDULED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'NOTE_ADDED'
  | 'REMARK_UPDATED'
  | 'TEAM_CREATED'
  | 'TEAM_ASSIGNED'
  | 'TEAM_REMOVED'
  | 'TEAM_UPDATED'
  | 'CAMPAIGN_ASSIGNED'
  | 'CAMPAIGN_REMOVED'
  | 'CAMPAIGN_UPDATED'
  | 'DEAL_CREATED'
  | 'DEAL_UPDATED'
  | 'DEAL_CLOSED'
  | 'PAYMENT_LINK_CLICKED'
  | 'PAYMENT_COMPLETED';

export type TeamActivityInitiatorType = 'user' | 'system' | 'team';

export interface ITeamActivity extends Document {
  teamId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: TeamActivityType;
  subType: TeamActivitySubType;
  description?: string;
  initiatorType: TeamActivityInitiatorType;
  initiatorId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TeamActivitySchema = new Schema<ITeamActivity>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['CONTACT', 'STATUS', 'DATE', 'TEAM', 'CAMPAIGN', 'DEAL', 'PAYMENT', 'ENGAGEMENT'],
    },
    subType: {
      type: String,
      required: true,
      enum: [
        'CONTACT_CREATED',
        'CONTACT_UPDATED',
        'CONTACT_DELETED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'LAST_CONTACTED',
        'NEXT_FOLLOW_UP',
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
        'TEAM_CREATED',
        'TEAM_ASSIGNED',
        'TEAM_REMOVED',
        'TEAM_UPDATED',
        'CAMPAIGN_ASSIGNED',
        'CAMPAIGN_REMOVED',
        'CAMPAIGN_UPDATED',
        'DEAL_CREATED',
        'DEAL_UPDATED',
        'DEAL_CLOSED',
        'PAYMENT_LINK_CLICKED',
        'PAYMENT_COMPLETED',
      ],
    },
    initiatorType: {
      type: String,
      required: true,
      enum: ['user', 'system', 'team'],
      default: 'system',
    },
    initiatorId: String,
    description: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
TeamActivitySchema.index({ teamId: 1 });
TeamActivitySchema.index({ userId: 1 });
TeamActivitySchema.index({ type: 1 });
TeamActivitySchema.index({ subType: 1 });
TeamActivitySchema.index({ initiatorType: 1 });
TeamActivitySchema.index({ createdAt: -1 });

// Add virtual fields for populated references
TeamActivitySchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
});

TeamActivitySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Add methods
TeamActivitySchema.methods.isUserInitiated = function (): boolean {
  return this.initiatorType === 'user';
};

TeamActivitySchema.methods.isSystemInitiated = function (): boolean {
  return this.initiatorType === 'system';
};

TeamActivitySchema.methods.isTeamInitiated = function (): boolean {
  return this.initiatorType === 'team';
};

export default mongoose.models.TeamActivity || mongoose.model<ITeamActivity>('TeamActivity', TeamActivitySchema);
