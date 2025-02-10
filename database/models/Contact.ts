import mongoose, { Schema, type Document } from 'mongoose';

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  company?: string;
  companyId?: Schema.Types.ObjectId;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  remark?: string;
  status: string;
  source?: string;
  assignedTo?: Schema.Types.ObjectId;
  stripeCustomerId?: string;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  priority: string;
  workExperience?: string;
  currentRole?: string;
  industry?: string;
  skills?: string;
  externalId?: string;
}

const ContactSchema = new Schema<IContact>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    gender: String,
    company: String,
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    jobTitle: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    remark: String,
    status: {
      type: String,
      enum: ['lead', 'appointment', 'pitch', 'trial', 'final', 'closed', 'junk'],
      default: 'lead',
    },
    source: String,
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    stripeCustomerId: String,
    joinedAt: Date,
    lastContactedAt: Date,
    nextFollowUpAt: Date,
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    workExperience: String,
    currentRole: String,
    industry: String,
    skills: String,
    externalId: String,
  },
  {
    timestamps: true,
  }
);

// Create indexes
ContactSchema.index({ email: 1 });
ContactSchema.index({ companyId: 1 });
ContactSchema.index({ assignedTo: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ priority: 1 });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
