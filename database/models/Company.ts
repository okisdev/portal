import mongoose, { Schema, type Document } from 'mongoose';

export type CompanyStatus = 'active' | 'inactive';

export interface ICompanyMetadata {
  customFields?: Record<string, any>;
  tags?: string[];
  notes?: string;
  lastModifiedBy?: string;
}

export interface ICompany extends Document {
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  status: CompanyStatus;
  metadata?: ICompanyMetadata;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  contacts?: any[];
  teams?: any[];
  customValues?: any[];
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => value.length >= 1 && value.length <= 200,
        message: 'Company name must be between 1 and 200 characters',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => {
          if (!value) return true;
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid website URL',
      },
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => {
          if (!value) return true;
          return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value);
        },
        message: 'Invalid phone number format',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => {
          if (!value) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Invalid email format',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
CompanySchema.virtual('contacts', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'companyId',
});

CompanySchema.virtual('teams', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'companyId',
});

CompanySchema.virtual('customValues', {
  ref: 'CompanyCustomValue',
  localField: '_id',
  foreignField: 'companyId',
});

// Methods
CompanySchema.methods.isActive = function (): boolean {
  return this.status === 'active';
};

CompanySchema.methods.activate = async function (): Promise<void> {
  this.status = 'active';
  await this.save();
};

CompanySchema.methods.deactivate = async function (): Promise<void> {
  this.status = 'inactive';
  await this.save();
};

CompanySchema.methods.getContactCount = async function (): Promise<number> {
  const Contact = mongoose.model('Contact');
  return await Contact.countDocuments({ companyId: this._id });
};

CompanySchema.methods.getTeamCount = async function (): Promise<number> {
  const Team = mongoose.model('Team');
  return await Team.countDocuments({ companyId: this._id });
};

// Indexes
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ email: 1 });
CompanySchema.index({ country: 1 });
CompanySchema.index({ city: 1 });
CompanySchema.index({ createdAt: -1 });

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
