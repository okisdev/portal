import mongoose, { Schema, type Document } from 'mongoose';

export type CalendarFolderVisibility = 'PUBLIC' | 'SHARED' | 'PRIVATE';

export interface ICalendarFolder extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  color: string;
  isDefault: boolean;
  visibility: CalendarFolderVisibility;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  user?: any;
  events?: any[];

  // Methods
  isPublic(): boolean;
  isShared(): boolean;
  isPrivate(): boolean;
  canBeViewedBy(userId: Schema.Types.ObjectId): Promise<boolean>;
  getEventCount(): Promise<number>;
}

const CalendarFolderSchema = new Schema<ICalendarFolder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => value.length >= 1 && value.length <= 100,
        message: 'Folder name must be between 1 and 100 characters',
      },
    },
    color: {
      type: String,
      default: '#4f46e5',
      validate: {
        validator: (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value),
        message: 'Color must be a valid hex color code',
      },
    },
    isDefault: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'SHARED', 'PRIVATE'],
      default: 'PRIVATE',
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
CalendarFolderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

CalendarFolderSchema.virtual('events', {
  ref: 'CalendarEvent',
  localField: '_id',
  foreignField: 'folderId',
});

// Methods
CalendarFolderSchema.methods.isPublic = function (): boolean {
  return this.visibility === 'PUBLIC';
};

CalendarFolderSchema.methods.isShared = function (): boolean {
  return this.visibility === 'SHARED';
};

CalendarFolderSchema.methods.isPrivate = function (): boolean {
  return this.visibility === 'PRIVATE';
};

CalendarFolderSchema.methods.canBeViewedBy = async function (userId: Schema.Types.ObjectId): Promise<boolean> {
  if (this.isPublic()) return true;
  if (this.userId.equals(userId)) return true;
  if (this.isPrivate()) return false;

  // For shared folders, check if user has explicit share permissions
  const CalendarEventShare = mongoose.model('CalendarEventShare');
  const share = await CalendarEventShare.findOne({
    folderId: this._id,
    sharedWithUserId: userId,
  });
  return !!share;
};

CalendarFolderSchema.methods.getEventCount = async function (): Promise<number> {
  const CalendarEvent = mongoose.model('CalendarEvent');
  return await CalendarEvent.countDocuments({ folderId: this._id });
};

// Indexes
CalendarFolderSchema.index({ userId: 1 });
CalendarFolderSchema.index({ isDefault: 1 });
CalendarFolderSchema.index({ visibility: 1 });
CalendarFolderSchema.index({ userId: 1, name: 1 }, { unique: true });

// Pre-save middleware
CalendarFolderSchema.pre('save', async function (next) {
  // If this is being set as default, unset any other default folders for this user
  if (this.isDefault && this.isModified('isDefault')) {
    const CalendarFolder = mongoose.model('CalendarFolder');
    await CalendarFolder.updateMany({ userId: this.userId, _id: { $ne: this._id } }, { $set: { isDefault: false } });
  }
  next();
});

// Ensure user has at least one default folder
CalendarFolderSchema.post('save', async function () {
  const CalendarFolder = mongoose.model('CalendarFolder');
  const defaultFolderExists = await CalendarFolder.exists({
    userId: this.userId,
    isDefault: true,
  });

  if (!defaultFolderExists) {
    // Set this as default if no other default exists
    await CalendarFolder.findByIdAndUpdate(this._id, { isDefault: true });
  }
});

export default mongoose.models.CalendarFolder || mongoose.model<ICalendarFolder>('CalendarFolder', CalendarFolderSchema);
