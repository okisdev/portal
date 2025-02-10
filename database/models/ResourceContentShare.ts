import mongoose, { Schema, type Document } from 'mongoose';

export type ResourceContentSharePermission = 'view' | 'edit';

export interface IResourceContentShare extends Document {
  resourceId: Schema.Types.ObjectId;
  sharedWithUserId: Schema.Types.ObjectId;
  permission: ResourceContentSharePermission;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  resource?: any;
  sharedWithUser?: any;
}

const ResourceContentShareSchema = new Schema<IResourceContentShare>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceContent',
      required: true,
    },
    sharedWithUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ResourceContentShareSchema.virtual('resource', {
  ref: 'ResourceContent',
  localField: 'resourceId',
  foreignField: '_id',
  justOne: true,
});

ResourceContentShareSchema.virtual('sharedWithUser', {
  ref: 'User',
  localField: 'sharedWithUserId',
  foreignField: '_id',
  justOne: true,
});

// Indexes
ResourceContentShareSchema.index({ resourceId: 1 });
ResourceContentShareSchema.index({ sharedWithUserId: 1 });
ResourceContentShareSchema.index({ resourceId: 1, sharedWithUserId: 1 }, { unique: true });

export default mongoose.models.ResourceContentShare || mongoose.model<IResourceContentShare>('ResourceContentShare', ResourceContentShareSchema);
