import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompanyCustomValue extends Document {
  companyId: Schema.Types.ObjectId;
  fieldId: Schema.Types.ObjectId;
  value: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  company?: any;
  field?: any;
}

const CompanyCustomValueSchema = new Schema<ICompanyCustomValue>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyCustomField',
      required: true,
    },
    value: {
      type: String,
      validate: {
        validator: async function (value: string) {
          const CompanyCustomField = mongoose.model('CompanyCustomField');
          const field = await CompanyCustomField.findById(this.fieldId);
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
CompanyCustomValueSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

CompanyCustomValueSchema.virtual('field', {
  ref: 'CompanyCustomField',
  localField: 'fieldId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware
CompanyCustomValueSchema.pre('save', async function (next) {
  // Format the value according to the field type
  const CompanyCustomField = mongoose.model('CompanyCustomField');
  const field = await CompanyCustomField.findById(this.fieldId);
  if (field) {
    this.value = field.formatValue(this.value);
  }
  next();
});

// Indexes
CompanyCustomValueSchema.index({ companyId: 1 });
CompanyCustomValueSchema.index({ fieldId: 1 });
CompanyCustomValueSchema.index({ companyId: 1, fieldId: 1 }, { unique: true });

export default mongoose.models.CompanyCustomValue || mongoose.model<ICompanyCustomValue>('CompanyCustomValue', CompanyCustomValueSchema);
