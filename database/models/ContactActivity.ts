import mongoose, { Schema, type Document } from 'mongoose';

export type ContactActivityType = (typeof ActivityTypes)[number];
export type ContactActivitySubType = (typeof ActivitySubTypes)[number];
export type ContactActivityInitiatorType = 'user' | 'contact' | 'system';

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

export interface IContactActivityMetadata {
  oldValue?: any;
  newValue?: any;
  reason?: string;
  source?: string;
  additionalInfo?: Record<string, any>;
}

export interface IContactActivity extends Document {
  contactId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: ContactActivityType;
  subType?: ContactActivitySubType;
  initiatorType: ContactActivityInitiatorType;
  initiatorId?: string;
  description?: string;
  metadata?: IContactActivityMetadata;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  contact?: any;
  user?: any;
}

const ContactActivitySchema = new Schema<IContactActivity>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ActivityTypes,
      required: true,
    },
    subType: {
      type: String,
      enum: ActivitySubTypes,
      validate: {
        validator: (value: string) => {
          if (!value) return true;
          return ActivitySubTypes.includes(value as ContactActivitySubType);
        },
        message: 'Invalid activity sub-type',
      },
    },
    initiatorType: {
      type: String,
      enum: ['user', 'contact', 'system'],
      default: 'system',
      required: true,
    },
    initiatorId: {
      type: String,
      validate: {
        validator: function (value: string) {
          if (!value) return true;
          return this.initiatorType !== 'system';
        },
        message: 'Initiator ID is required for non-system activities',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ContactActivitySchema.virtual('contact', {
  ref: 'Contact',
  localField: 'contactId',
  foreignField: '_id',
  justOne: true,
});

ContactActivitySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Methods
ContactActivitySchema.methods.isUserInitiated = function (): boolean {
  return this.initiatorType === 'user';
};

ContactActivitySchema.methods.isContactInitiated = function (): boolean {
  return this.initiatorType === 'contact';
};

ContactActivitySchema.methods.isSystemInitiated = function (): boolean {
  return this.initiatorType === 'system';
};

ContactActivitySchema.methods.getFormattedDescription = function (): string {
  if (this.description) return this.description;

  // Generate a default description based on type and subType
  const parts: string[] = [];

  switch (this.type) {
    case 'STATUS':
      if (this.metadata?.oldValue && this.metadata?.newValue) {
        parts.push(`Status changed from ${this.metadata.oldValue} to ${this.metadata.newValue}`);
      }
      break;
    case 'DATE':
      if (this.subType === 'LAST_CONTACTED') {
        parts.push('Contact was last contacted');
      } else if (this.subType === 'NEXT_FOLLOW_UP') {
        parts.push('Next follow-up scheduled');
      }
      break;
    case 'ENGAGEMENT':
      if (this.subType === 'NOTE_ADDED') {
        parts.push('Note added');
      } else if (this.subType?.includes('EMAIL')) {
        parts.push('Email interaction');
      } else if (this.subType?.includes('MEETING')) {
        parts.push('Meeting interaction');
      }
      break;
    default:
      parts.push(this.type.toLowerCase());
  }

  if (this.metadata?.reason) {
    parts.push(`- ${this.metadata.reason}`);
  }

  return parts.join(' ');
};

// Indexes
ContactActivitySchema.index({ contactId: 1 });
ContactActivitySchema.index({ userId: 1 });
ContactActivitySchema.index({ type: 1 });
ContactActivitySchema.index({ subType: 1 });
ContactActivitySchema.index({ initiatorType: 1 });
ContactActivitySchema.index({ createdAt: -1 });
ContactActivitySchema.index({ contactId: 1, createdAt: -1 });
ContactActivitySchema.index({ contactId: 1, type: 1, createdAt: -1 });

export default mongoose.models.ContactActivity || mongoose.model<IContactActivity>('ContactActivity', ContactActivitySchema);
