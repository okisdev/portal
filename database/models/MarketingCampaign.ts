import mongoose, { Schema, type Document } from 'mongoose';

export interface IMarketingCampaign extends Document {
  name: string;
  campaignCode: string;
  description?: string;
  type: string;
  status: string;
  metrics?: string;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketingCampaignSchema = new Schema<IMarketingCampaign>(
  {
    name: { type: String, required: true },
    campaignCode: { type: String, required: true, unique: true },
    description: String,
    type: {
      type: String,
      enum: ['email', 'social', 'event', 'referral', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      required: true,
    },
    metrics: String, // JSON string for metrics data
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Create indexes
MarketingCampaignSchema.index({ campaignCode: 1 }, { unique: true });
MarketingCampaignSchema.index({ type: 1 });
MarketingCampaignSchema.index({ status: 1 });
MarketingCampaignSchema.index({ createdBy: 1 });

export default mongoose.models.MarketingCampaign || mongoose.model<IMarketingCampaign>('MarketingCampaign', MarketingCampaignSchema);
