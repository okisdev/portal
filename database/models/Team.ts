import mongoose, { Schema, type Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  companyId?: Schema.Types.ObjectId;
  leaderId?: Schema.Types.ObjectId;
  subLeaderId?: Schema.Types.ObjectId;
  referralId?: Schema.Types.ObjectId;
  campaignCode?: string;
  remarks?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: String,
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    leaderId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    subLeaderId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    referralId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    campaignCode: String,
    remarks: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Create indexes
TeamSchema.index({ companyId: 1 });
TeamSchema.index({ leaderId: 1 });
TeamSchema.index({ createdBy: 1 });
TeamSchema.index({ campaignCode: 1 });

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
