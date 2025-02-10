import mongoose, { Schema, type Document } from 'mongoose';

export interface ISiteConfig extends Document {
  key: string;
  value: string;
  description?: string;
  type: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: {
      type: String,
      enum: ['name', 'description', 'domain'],
      required: true,
      unique: true,
    },
    value: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json', 'array'],
      default: 'string',
      required: true,
    },
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create indexes
SiteConfigSchema.index({ key: 1 }, { unique: true });
SiteConfigSchema.index({ isPublic: 1 });

export default mongoose.models.SiteConfig || mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);
