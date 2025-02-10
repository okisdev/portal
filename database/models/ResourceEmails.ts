import mongoose, { Schema, type Document } from 'mongoose';

export type ResourceEmailVisibility = 'PUBLIC' | 'SHARED' | 'PRIVATE';

export interface IResourceEmail extends Document {
  title: string;
  description?: string;
  subject: string;
  content: string;
  tags?: string[];
  visibility: ResourceEmailVisibility;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  creator?: any;
  lastUpdater?: any;
}

const ResourceEmailSchema = new Schema<IResourceEmail>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => value.length >= 1 && value.length <= 200,
        message: 'Title must be between 1 and 200 characters',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => value.length >= 1 && value.length <= 200,
        message: 'Subject must be between 1 and 200 characters',
      },
    },
    content: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => value.length >= 1,
        message: 'Content cannot be empty',
      },
    },
    tags: {
      type: [String],
      validate: {
        validator: (value: string[]) => value.every((tag) => tag.length >= 1 && tag.length <= 50),
        message: 'Each tag must be between 1 and 50 characters',
      },
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'SHARED', 'PRIVATE'],
      default: 'PRIVATE',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ResourceEmailSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

ResourceEmailSchema.virtual('lastUpdater', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Methods
ResourceEmailSchema.methods.isPublic = function (): boolean {
  return this.visibility === 'PUBLIC';
};

ResourceEmailSchema.methods.isShared = function (): boolean {
  return this.visibility === 'SHARED';
};

ResourceEmailSchema.methods.isPrivate = function (): boolean {
  return this.visibility === 'PRIVATE';
};

ResourceEmailSchema.methods.canBeViewedBy = async function (userId: Schema.Types.ObjectId): Promise<boolean> {
  if (this.isPublic()) return true;
  if (this.createdBy.equals(userId)) return true;
  if (this.isPrivate()) return false;

  // For shared emails, check if user has explicit share permissions
  const ResourceContentShare = mongoose.model('ResourceContentShare');
  const share = await ResourceContentShare.findOne({
    resourceId: this._id,
    sharedWithUserId: userId,
  });
  return !!share;
};

// Indexes
ResourceEmailSchema.index({ title: 1 });
ResourceEmailSchema.index({ subject: 1 });
ResourceEmailSchema.index({ tags: 1 });
ResourceEmailSchema.index({ visibility: 1 });
ResourceEmailSchema.index({ createdBy: 1 });
ResourceEmailSchema.index({ updatedBy: 1 });
ResourceEmailSchema.index({ createdAt: -1 });

export default mongoose.models.ResourceEmail || mongoose.model<IResourceEmail>('ResourceEmail', ResourceEmailSchema);
