import mongoose, { Schema, type Document } from 'mongoose';

export type SendTrackStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface IResourceContentSendTrack extends Document {
  resourceId: Schema.Types.ObjectId;
  contactId: Schema.Types.ObjectId;
  sentAt: Date;
  sentBy: Schema.Types.ObjectId;
  status: SendTrackStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  resource?: any;
  contact?: any;
  sender?: any;
}

const ResourceContentSendTrackSchema = new Schema<IResourceContentSendTrack>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceContent',
      required: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      description: 'Additional data like delivery channel, error messages, etc.',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ResourceContentSendTrackSchema.virtual('resource', {
  ref: 'ResourceContent',
  localField: 'resourceId',
  foreignField: '_id',
  justOne: true,
});

ResourceContentSendTrackSchema.virtual('contact', {
  ref: 'Contact',
  localField: 'contactId',
  foreignField: '_id',
  justOne: true,
});

ResourceContentSendTrackSchema.virtual('sender', {
  ref: 'User',
  localField: 'sentBy',
  foreignField: '_id',
  justOne: true,
});

// Methods
ResourceContentSendTrackSchema.methods.isDelivered = function (): boolean {
  return ['delivered', 'read'].includes(this.status);
};

ResourceContentSendTrackSchema.methods.isRead = function (): boolean {
  return this.status === 'read';
};

ResourceContentSendTrackSchema.methods.isFailed = function (): boolean {
  return this.status === 'failed';
};

// Indexes
ResourceContentSendTrackSchema.index({ resourceId: 1 });
ResourceContentSendTrackSchema.index({ contactId: 1 });
ResourceContentSendTrackSchema.index({ sentBy: 1 });
ResourceContentSendTrackSchema.index({ status: 1 });
ResourceContentSendTrackSchema.index({ sentAt: -1 });
ResourceContentSendTrackSchema.index({ resourceId: 1, contactId: 1, sentAt: -1 });

export default mongoose.models.ResourceContentSendTrack || mongoose.model<IResourceContentSendTrack>('ResourceContentSendTrack', ResourceContentSendTrackSchema);
