import mongoose, { Schema, type Document } from 'mongoose';

export interface IRecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  until?: Date;
  count?: number;
  byWeekDay?: string[];
  byMonthDay?: number[];
  byMonth?: number[];
  excludeDates?: Date[];
}

export interface ICalendarEventMetadata {
  conferenceLink?: string;
  conferenceProvider?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  customFields?: Record<string, any>;
  lastModifiedBy?: string;
}

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
  recurrence?: IRecurrenceRule;
  metadata?: ICalendarEventMetadata;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  folder?: any;
  user?: any;
  participants?: any[];

  // Methods
  getDuration(): number;
  isOngoing(): boolean;
  isPast(): boolean;
  isFuture(): boolean;
  overlaps(event: ICalendarEvent): boolean;
  toPublicJSON(): Record<string, any>;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'CalendarFolder', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    isAllDay: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    recurrence: {
      type: Schema.Types.Mixed,
      validate: {
        validator: (value: IRecurrenceRule) => {
          if (!value) return true;
          return value.frequency && ['daily', 'weekly', 'monthly', 'yearly'].includes(value.frequency);
        },
        message: 'Invalid recurrence rule',
      },
    },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
CalendarEventSchema.virtual('folder', {
  ref: 'CalendarFolder',
  localField: 'folderId',
  foreignField: '_id',
  justOne: true,
});

CalendarEventSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

CalendarEventSchema.virtual('participants', {
  ref: 'CalendarEventParticipant',
  localField: '_id',
  foreignField: 'eventId',
});

// Methods
CalendarEventSchema.methods.getDuration = function (): number {
  return this.endAt.getTime() - this.startAt.getTime();
};

CalendarEventSchema.methods.isOngoing = function (): boolean {
  const now = new Date();
  return this.startAt <= now && now <= this.endAt;
};

CalendarEventSchema.methods.isPast = function (): boolean {
  return this.endAt < new Date();
};

CalendarEventSchema.methods.isFuture = function (): boolean {
  return this.startAt > new Date();
};

CalendarEventSchema.methods.overlaps = function (event: ICalendarEvent): boolean {
  return this.startAt < event.endAt && this.endAt > event.startAt;
};

CalendarEventSchema.methods.toPublicJSON = function (): Record<string, any> {
  const obj = this.toJSON();
  const publicObj: Record<string, any> = {
    id: obj.id,
    startAt: obj.startAt,
    endAt: obj.endAt,
    isAllDay: obj.isAllDay,
    isPublic: obj.isPublic,
  };

  if (this.isPublic) {
    publicObj.title = obj.title;
    publicObj.description = obj.description;
    publicObj.location = obj.location;
    publicObj.participants = obj.participants;
  } else {
    publicObj.title = 'Busy';
  }

  return publicObj;
};

// Indexes
CalendarEventSchema.index({ userId: 1 });
CalendarEventSchema.index({ folderId: 1 });
CalendarEventSchema.index({ startAt: 1 });
CalendarEventSchema.index({ endAt: 1 });
CalendarEventSchema.index({ isPublic: 1 });
CalendarEventSchema.index({ userId: 1, startAt: 1 });
CalendarEventSchema.index({ userId: 1, endAt: 1 });

// Pre-save middleware
CalendarEventSchema.pre('save', function (next) {
  // Ensure endAt is after startAt
  if (this.endAt < this.startAt) {
    next(new Error('End date must be after start date'));
  }
  next();
});

export default mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
