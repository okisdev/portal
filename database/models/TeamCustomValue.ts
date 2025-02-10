import mongoose, { Schema, type Document } from 'mongoose';

export interface ITeamCustomValue extends Document {
  teamId: Schema.Types.ObjectId;
  fieldId: Schema.Types.ObjectId;
  value: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  team?: any;
  field?: any;
}

const TeamCustomValueSchema = new Schema<ITeamCustomValue>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'TeamCustomField',
      required: true,
    },
    value: {
      type: String,
      validate: {
        validator: async function (value: string) {
          const TeamCustomField = mongoose.model('TeamCustomField');
          const field = await TeamCustomField.findById(this.fieldId);
          if (!field) return false;
          return field.validateValue(value);
        },
        message: 'Invalid value for the custom field type',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
TeamCustomValueSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
});

TeamCustomValueSchema.virtual('field', {
  ref: 'TeamCustomField',
  localField: 'fieldId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware
TeamCustomValueSchema.pre('save', async function (next) {
  // Format the value according to the field type
  const TeamCustomField = mongoose.model('TeamCustomField');
  const field = await TeamCustomField.findById(this.fieldId);
  if (field) {
    this.value = field.formatValue(this.value);
  }
  next();
});

// Indexes
TeamCustomValueSchema.index({ teamId: 1 });
TeamCustomValueSchema.index({ fieldId: 1 });
TeamCustomValueSchema.index({ teamId: 1, fieldId: 1 }, { unique: true });

export default mongoose.models.TeamCustomValue || mongoose.model<ITeamCustomValue>('TeamCustomValue', TeamCustomValueSchema);
