import mongoose, { Schema, type Document } from 'mongoose';

export interface IContactCustomValue extends Document {
  contactId: Schema.Types.ObjectId;
  fieldId: Schema.Types.ObjectId;
  value: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  contact?: any;
  field?: any;
}

const ContactCustomValueSchema = new Schema<IContactCustomValue>(
  {
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'ContactCustomField',
      required: true,
    },
    value: {
      type: String,
      validate: {
        validator: async function (value: string) {
          const ContactCustomField = mongoose.model('ContactCustomField');
          const field = await ContactCustomField.findById(this.fieldId);
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
ContactCustomValueSchema.virtual('contact', {
  ref: 'Contact',
  localField: 'contactId',
  foreignField: '_id',
  justOne: true,
});

ContactCustomValueSchema.virtual('field', {
  ref: 'ContactCustomField',
  localField: 'fieldId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware
ContactCustomValueSchema.pre('save', async function (next) {
  // Format the value according to the field type
  const ContactCustomField = mongoose.model('ContactCustomField');
  const field = await ContactCustomField.findById(this.fieldId);
  if (field) {
    this.value = field.formatValue(this.value);
  }
  next();
});

// Indexes
ContactCustomValueSchema.index({ contactId: 1 });
ContactCustomValueSchema.index({ fieldId: 1 });
ContactCustomValueSchema.index({ contactId: 1, fieldId: 1 }, { unique: true });

export default mongoose.models.ContactCustomValue || mongoose.model<IContactCustomValue>('ContactCustomValue', ContactCustomValueSchema);
