import mongoose, { Schema, type Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  userId: Schema.Types.ObjectId;
  folderId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  isPublic: boolean;
  recurrence?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'CalendarFolder', required: true },
    title: { type: String, required: true },
    description: String,
    location: String,
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    isAllDay: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    recurrence: String, // JSON string for recurrence rules
    metadata: String, // JSON string for additional data
  },
  {
    timestamps: true,
  }
);

// Create indexes
CalendarEventSchema.index({ userId: 1 });
CalendarEventSchema.index({ folderId: 1 });
CalendarEventSchema.index({ startAt: 1 });
CalendarEventSchema.index({ endAt: 1 });

export default mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
