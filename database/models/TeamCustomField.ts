import mongoose, { Schema, type Document } from 'mongoose';

export type TeamCustomFieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';

export interface ITeamCustomField extends Document {
  name: string;
  label: string;
  type: TeamCustomFieldType;
  options?: string[];
  required: boolean;
  defaultValue?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamCustomFieldSchema = new Schema<ITeamCustomField>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value),
        message: 'Field name must start with a letter and contain only letters, numbers, and underscores',
      },
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect'],
    },
    options: {
      type: [String],
      validate: {
        validator: function (value: string[]) {
          if (!value) return true;
          if (!['select', 'multiselect'].includes(this.type)) return true;
          return value.length > 0 && value.every((opt) => opt.length > 0);
        },
        message: 'Options are required for select/multiselect fields and must not be empty',
      },
    },
    required: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: String,
      validate: {
        validator: function (value: string) {
          if (!value) return true;

          switch (this.type) {
            case 'boolean':
              return ['true', 'false'].includes(value.toLowerCase());
            case 'number':
              return !Number.isNaN(Number(value));
            case 'date': {
              const date = new Date(value);
              return !Number.isNaN(date.getTime());
            }
            case 'select':
              return this.options?.includes(value);
            case 'multiselect': {
              const values = value.split(',').map((v) => v.trim());
              return values.every((v) => this.options?.includes(v));
            }
            default:
              return true;
          }
        },
        message: 'Default value must match the field type and be within the options if specified',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Methods
TeamCustomFieldSchema.methods.validateValue = function (value: any): boolean {
  if (this.required && (value === undefined || value === null || value === '')) {
    return false;
  }

  if (value === undefined || value === null || value === '') {
    return true;
  }

  switch (this.type) {
    case 'boolean':
      return typeof value === 'boolean' || ['true', 'false'].includes(String(value).toLowerCase());
    case 'number':
      return !Number.isNaN(Number(value));
    case 'date': {
      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    }
    case 'select':
      return this.options?.includes(String(value));
    case 'multiselect': {
      const values = Array.isArray(value)
        ? value
        : String(value)
            .split(',')
            .map((v) => v.trim());
      return values.every((v) => this.options?.includes(v));
    }
    default:
      return true;
  }
};

TeamCustomFieldSchema.methods.formatValue = function (value: any): any {
  if (value === undefined || value === null || value === '') {
    return this.defaultValue || null;
  }

  switch (this.type) {
    case 'boolean':
      return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
    case 'number':
      return Number(value);
    case 'date':
      return new Date(value);
    case 'multiselect': {
      const values = Array.isArray(value)
        ? value
        : String(value)
            .split(',')
            .map((v) => v.trim());
      return values;
    }
    default:
      return String(value);
  }
};

// Indexes
TeamCustomFieldSchema.index({ name: 1 }, { unique: true });
TeamCustomFieldSchema.index({ isActive: 1 });
TeamCustomFieldSchema.index({ type: 1 });
TeamCustomFieldSchema.index({ required: 1 });

export default mongoose.models.TeamCustomField || mongoose.model<ITeamCustomField>('TeamCustomField', TeamCustomFieldSchema);
