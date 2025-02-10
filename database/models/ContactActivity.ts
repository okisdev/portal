import mongoose, { Schema, type Document } from 'mongoose';

export interface IContactActivity extends Document {
  contactId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: string;
  subType?: string;
  initiatorType: string;
  initiatorId?: string;
  description?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityTypes = ['CONTACT', 'STATUS', 'DATE', 'TEAM', 'CAMPAIGN', 'DEAL', 'PAYMENT', 'ENGAGEMENT'] as const;

const ActivitySubTypes = [
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
] as const;

const ContactActivitySchema = new Schema<IContactActivity>(
  {
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ActivityTypes,
      required: true,
    },
    subType: {
      type: String,
      enum: ActivitySubTypes,
    },
    initiatorType: {
      type: String,
      enum: ['user', 'contact', 'system'],
      default: 'system',
      required: true,
    },
    initiatorId: String,
    description: String,
    metadata: String, // JSON string for additional data
  },
  {
    timestamps: true,
  }
);

// Create indexes
ContactActivitySchema.index({ contactId: 1 });
ContactActivitySchema.index({ userId: 1 });
ContactActivitySchema.index({ type: 1 });
ContactActivitySchema.index({ createdAt: 1 });

export default mongoose.models.ContactActivity || mongoose.model<IContactActivity>('ContactActivity', ContactActivitySchema);
