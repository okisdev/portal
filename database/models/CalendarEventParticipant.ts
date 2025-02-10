import mongoose, { Schema, type Document } from 'mongoose';

export type ParticipantType = 'user' | 'contact' | 'external';
export type ParticipantStatus = 'pending' | 'accepted' | 'declined' | 'tentative';
export type ParticipantRole = 'organizer' | 'required' | 'optional';

export interface ICalendarEventParticipant extends Document {
  eventId: Schema.Types.ObjectId;
  participantType: ParticipantType;
  participantId?: Schema.Types.ObjectId;
  email?: string;
  name?: string;
  status: ParticipantStatus;
  role: ParticipantRole;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  event?: any;
  user?: any;
  contact?: any;

  // Methods
  isOrganizer(): boolean;
  isRequired(): boolean;
  isOptional(): boolean;
  hasResponded(): boolean;
  isAttending(): boolean;
  getDisplayName(): string;
}

const CalendarEventParticipantSchema = new Schema<ICalendarEventParticipant>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'CalendarEvent', required: true },
    participantType: {
      type: String,
      required: true,
      enum: ['user', 'contact', 'external'],
      validate: {
        validator: function (value: string) {
          if (value === 'external') {
            return !!(this.email && this.name);
          }
          return !!this.participantId;
        },
        message: 'External participants must have email and name, internal participants must have participantId',
      },
    },
    participantId: {
      type: Schema.Types.ObjectId,
      refPath: 'participantType',
      validate: {
        validator: function (value: Schema.Types.ObjectId) {
          return this.participantType === 'external' || !!value;
        },
        message: 'ParticipantId is required for internal participants',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value: string) {
          return this.participantType !== 'external' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Invalid email format for external participant',
      },
    },
    name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending',
    },
    role: {
      type: String,
      required: true,
      enum: ['organizer', 'required', 'optional'],
      default: 'required',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
CalendarEventParticipantSchema.virtual('event', {
  ref: 'CalendarEvent',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
});

CalendarEventParticipantSchema.virtual('user', {
  ref: 'User',
  localField: 'participantId',
  foreignField: '_id',
  justOne: true,
});

CalendarEventParticipantSchema.virtual('contact', {
  ref: 'Contact',
  localField: 'participantId',
  foreignField: '_id',
  justOne: true,
});

// Methods
CalendarEventParticipantSchema.methods.isOrganizer = function (): boolean {
  return this.role === 'organizer';
};

CalendarEventParticipantSchema.methods.isRequired = function (): boolean {
  return this.role === 'required';
};

CalendarEventParticipantSchema.methods.isOptional = function (): boolean {
  return this.role === 'optional';
};

CalendarEventParticipantSchema.methods.hasResponded = function (): boolean {
  return this.status !== 'pending';
};

CalendarEventParticipantSchema.methods.isAttending = function (): boolean {
  return this.status === 'accepted';
};

CalendarEventParticipantSchema.methods.getDisplayName = function (): string {
  if (this.participantType === 'external') {
    return this.name || this.email || 'Unknown Participant';
  }
  return this.name || 'Unnamed Participant';
};

// Indexes
CalendarEventParticipantSchema.index({ eventId: 1 });
CalendarEventParticipantSchema.index({ participantId: 1 });
CalendarEventParticipantSchema.index({ email: 1 });
CalendarEventParticipantSchema.index({ name: 1 });
CalendarEventParticipantSchema.index({ status: 1 });
CalendarEventParticipantSchema.index({ role: 1 });
CalendarEventParticipantSchema.index({ eventId: 1, participantId: 1 }, { unique: true });
CalendarEventParticipantSchema.index({ eventId: 1, email: 1 }, { unique: true, sparse: true });

// Pre-save middleware
CalendarEventParticipantSchema.pre('save', function (next) {
  // Ensure organizer is always accepted
  if (this.role === 'organizer' && this.status === 'pending') {
    this.status = 'accepted';
  }
  next();
});

export default mongoose.models.CalendarEventParticipant || mongoose.model<ICalendarEventParticipant>('CalendarEventParticipant', CalendarEventParticipantSchema);
