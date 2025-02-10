import mongoose, { Schema, type Document } from 'mongoose';

export interface ITeamContact extends Document {
  teamId: Schema.Types.ObjectId;
  contactId: Schema.Types.ObjectId;
  assignedTo?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamContactSchema = new Schema<ITeamContact>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Create indexes
TeamContactSchema.index({ teamId: 1, contactId: 1 }, { unique: true });
TeamContactSchema.index({ assignedTo: 1 });

export default mongoose.models.TeamContact || mongoose.model<ITeamContact>('TeamContact', TeamContactSchema);
