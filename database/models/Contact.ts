import mongoose, { Schema, type Document } from 'mongoose';

export type ContactStatus = 'lead' | 'appointment' | 'pitch' | 'trial' | 'final' | 'closed' | 'junk';
export type ContactPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ContactGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: ContactGender;
  company?: string;
  companyId?: Schema.Types.ObjectId;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  remark?: string;
  status: ContactStatus;
  source?: string;
  assignedTo?: Schema.Types.ObjectId;
  stripeCustomerId?: string;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  priority: ContactPriority;
  workExperience?: string;
  currentRole?: string;
  industry?: string;
  skills?: string;
  externalId?: string;

  // Virtual fields
  companyRef?: any;
  assignedToUser?: any;
  activities?: any[];
  customValues?: any[];
  campaigns?: any[];
  teams?: any[];

  // Methods
  getFullName(): string;
  getDisplayName(): string;
  isAssigned(): boolean;
  needsFollowUp(): boolean;
  daysSinceLastContact(): number;
  daysUntilNextFollowUp(): number;
}

const ContactSchema = new Schema<IContact>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => value.length >= 1 && value.length <= 100,
        message: 'First name must be between 1 and 100 characters',
      },
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => value.length >= 1 && value.length <= 100,
        message: 'Last name must be between 1 and 100 characters',
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Invalid email format',
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => {
          if (!value) return true;
          return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value);
        },
        message: 'Invalid phone number format',
      },
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['lead', 'appointment', 'pitch', 'trial', 'final', 'closed', 'junk'],
      default: 'lead',
      required: true,
    },
    source: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    stripeCustomerId: {
      type: String,
      trim: true,
    },
    joinedAt: Date,
    lastContactedAt: Date,
    nextFollowUpAt: Date,
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
      required: true,
    },
    workExperience: {
      type: String,
      trim: true,
    },
    currentRole: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    skills: {
      type: String,
      trim: true,
    },
    externalId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ContactSchema.virtual('companyRef', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

ContactSchema.virtual('assignedToUser', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
});

ContactSchema.virtual('activities', {
  ref: 'ContactActivity',
  localField: '_id',
  foreignField: 'contactId',
});

ContactSchema.virtual('customValues', {
  ref: 'ContactCustomValue',
  localField: '_id',
  foreignField: 'contactId',
});

ContactSchema.virtual('campaigns', {
  ref: 'ContactCampaign',
  localField: '_id',
  foreignField: 'contactId',
});

ContactSchema.virtual('teams', {
  ref: 'TeamContact',
  localField: '_id',
  foreignField: 'contactId',
});

// Methods
ContactSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

ContactSchema.methods.getDisplayName = function (): string {
  return this.getFullName() || this.email;
};

ContactSchema.methods.isAssigned = function (): boolean {
  return !!this.assignedTo;
};

ContactSchema.methods.needsFollowUp = function (): boolean {
  if (!this.nextFollowUpAt) return false;
  return this.nextFollowUpAt <= new Date();
};

ContactSchema.methods.daysSinceLastContact = function (): number {
  if (!this.lastContactedAt) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - this.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24));
};

ContactSchema.methods.daysUntilNextFollowUp = function (): number {
  if (!this.nextFollowUpAt) return Number.POSITIVE_INFINITY;
  return Math.floor((this.nextFollowUpAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

// Indexes
ContactSchema.index({ email: 1 }, { unique: true });
ContactSchema.index({ companyId: 1 });
ContactSchema.index({ assignedTo: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ priority: 1 });
ContactSchema.index({ lastContactedAt: 1 });
ContactSchema.index({ nextFollowUpAt: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ firstName: 1, lastName: 1 });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
