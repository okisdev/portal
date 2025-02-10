import mongoose, { Schema, type Document } from 'mongoose';

export interface IContactCampaign extends Document {
  contactId: Schema.Types.ObjectId;
  campaignCode: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  contact?: any;
  campaign?: any;
}

const ContactCampaignSchema = new Schema<IContactCampaign>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    campaignCode: {
      type: String,
      ref: 'MarketingCampaign',
      required: true,
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ContactCampaignSchema.virtual('contact', {
  ref: 'Contact',
  localField: 'contactId',
  foreignField: '_id',
  justOne: true,
});

ContactCampaignSchema.virtual('campaign', {
  ref: 'MarketingCampaign',
  localField: 'campaignCode',
  foreignField: 'campaignCode',
  justOne: true,
});

// Methods
ContactCampaignSchema.methods.getDaysInCampaign = function (): number {
  return Math.floor((Date.now() - this.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
};

// Indexes
ContactCampaignSchema.index({ contactId: 1 });
ContactCampaignSchema.index({ campaignCode: 1 });
ContactCampaignSchema.index({ joinedAt: -1 });
ContactCampaignSchema.index({ contactId: 1, campaignCode: 1 }, { unique: true });

export default mongoose.models.ContactCampaign || mongoose.model<IContactCampaign>('ContactCampaign', ContactCampaignSchema);
