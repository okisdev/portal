import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  status: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    description: String,
    industry: String,
    size: String,
    website: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    phone: String,
    email: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    metadata: String, // JSON string for additional data
  },
  {
    timestamps: true,
  }
);

// Create indexes
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ status: 1 });

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
