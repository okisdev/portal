import mongoose, { Schema, type Document } from 'mongoose';

export interface ICalendarFolder extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  color: string;
  isDefault: boolean;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarFolderSchema = new Schema<ICalendarFolder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    color: { type: String, default: '#4f46e5' },
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
  }
);

// Create indexes
CalendarFolderSchema.index({ userId: 1 });
CalendarFolderSchema.index({ isDefault: 1 });
CalendarFolderSchema.index({ visibility: 1 });

export default mongoose.models.CalendarFolder || mongoose.model<ICalendarFolder>('CalendarFolder', CalendarFolderSchema);
