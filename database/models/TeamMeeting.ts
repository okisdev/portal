import mongoose, { Schema, type Document } from 'mongoose';

export type TeamMeetingStatus = 'upcoming' | 'completed' | 'cancelled' | 'no_show';

export interface ITeamMeeting extends Document {
  teamId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  meetingDate: Date;
  status: TeamMeetingStatus;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  team?: any;
  creator?: any;
}

const TeamMeetingSchema = new Schema<ITeamMeeting>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
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
    meetingDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value: Date) => value >= new Date(),
        message: 'Meeting date must be in the future',
      },
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled', 'no_show'],
      default: 'upcoming',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
TeamMeetingSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
});

TeamMeetingSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Methods
TeamMeetingSchema.methods.isUpcoming = function (): boolean {
  return this.status === 'upcoming';
};

TeamMeetingSchema.methods.isCompleted = function (): boolean {
  return this.status === 'completed';
};

TeamMeetingSchema.methods.isCancelled = function (): boolean {
  return this.status === 'cancelled';
};

TeamMeetingSchema.methods.isNoShow = function (): boolean {
  return this.status === 'no_show';
};

TeamMeetingSchema.methods.complete = async function (): Promise<void> {
  this.status = 'completed';
  await this.save();
};

TeamMeetingSchema.methods.cancel = async function (): Promise<void> {
  this.status = 'cancelled';
  await this.save();
};

TeamMeetingSchema.methods.markNoShow = async function (): Promise<void> {
  this.status = 'no_show';
  await this.save();
};

// Indexes
TeamMeetingSchema.index({ teamId: 1 });
TeamMeetingSchema.index({ meetingDate: 1 });
TeamMeetingSchema.index({ status: 1 });
TeamMeetingSchema.index({ createdBy: 1 });
TeamMeetingSchema.index({ teamId: 1, meetingDate: 1 });

export default mongoose.models.TeamMeeting || mongoose.model<ITeamMeeting>('TeamMeeting', TeamMeetingSchema);
