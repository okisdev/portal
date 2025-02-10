import mongoose, { type Model } from 'mongoose';
import type { AdapterUser } from 'next-auth/adapters';

// Extended AdapterUser interface to include additional fields
interface ExtendedAdapterUser extends AdapterUser {
  role?: 'ADMIN' | 'SALES' | 'MANAGER' | 'USER';
  timezone?: string;
  username?: string;
  password?: string;
  hasRole?: (role: 'ADMIN' | 'SALES' | 'MANAGER' | 'USER') => boolean;
  isAdmin?: () => boolean;
}

// @Schema
const UserSchema = new mongoose.Schema<ExtendedAdapterUser>(
  {
    id: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    emailVerified: {
      type: Date,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      trim: true,
      select: false, // Don't include password in query results by default
    },
    image: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'SALES', 'MANAGER', 'USER'],
      default: 'USER',
      required: true,
      trim: true,
    },
    timezone: {
      type: String,
      enum: [
        // Africa
        'Africa/Cairo',
        'Africa/Casablanca',
        'Africa/Johannesburg',
        'Africa/Lagos',
        'Africa/Nairobi',
        // America
        'America/Anchorage',
        'America/Argentina/Buenos_Aires',
        'America/Bogota',
        'America/Caracas',
        'America/Chicago',
        'America/Denver',
        'America/Edmonton',
        'America/Halifax',
        'America/Lima',
        'America/Los_Angeles',
        'America/Mexico_City',
        'America/New_York',
        'America/Phoenix',
        'America/Santiago',
        'America/Sao_Paulo',
        'America/St_Johns',
        'America/Toronto',
        'America/Vancouver',
        // Asia
        'Asia/Almaty',
        'Asia/Baghdad',
        'Asia/Baku',
        'Asia/Bangkok',
        'Asia/Beirut',
        'Asia/Colombo',
        'Asia/Dhaka',
        'Asia/Dubai',
        'Asia/Ho_Chi_Minh',
        'Asia/Hong_Kong',
        'Asia/Istanbul',
        'Asia/Jakarta',
        'Asia/Jerusalem',
        'Asia/Kabul',
        'Asia/Karachi',
        'Asia/Kathmandu',
        'Asia/Kolkata',
        'Asia/Kuala_Lumpur',
        'Asia/Kuwait',
        'Asia/Manila',
        'Asia/Muscat',
        'Asia/Riyadh',
        'Asia/Seoul',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Asia/Taipei',
        'Asia/Tashkent',
        'Asia/Tehran',
        'Asia/Tokyo',
        'Asia/Ulaanbaatar',
        'Asia/Yangon',
        // Atlantic
        'Atlantic/Azores',
        'Atlantic/Cape_Verde',
        'Atlantic/Reykjavik',
        // Australia
        'Australia/Adelaide',
        'Australia/Brisbane',
        'Australia/Darwin',
        'Australia/Hobart',
        'Australia/Melbourne',
        'Australia/Perth',
        'Australia/Sydney',
        // Europe
        'Europe/Amsterdam',
        'Europe/Athens',
        'Europe/Belgrade',
        'Europe/Berlin',
        'Europe/Brussels',
        'Europe/Bucharest',
        'Europe/Budapest',
        'Europe/Copenhagen',
        'Europe/Dublin',
        'Europe/Helsinki',
        'Europe/Istanbul',
        'Europe/Kiev',
        'Europe/Lisbon',
        'Europe/London',
        'Europe/Madrid',
        'Europe/Moscow',
        'Europe/Oslo',
        'Europe/Paris',
        'Europe/Prague',
        'Europe/Rome',
        'Europe/Stockholm',
        'Europe/Vienna',
        'Europe/Warsaw',
        'Europe/Zurich',
        // Indian
        'Indian/Maldives',
        'Indian/Mauritius',
        // Pacific
        'Pacific/Auckland',
        'Pacific/Fiji',
        'Pacific/Guam',
        'Pacific/Honolulu',
        'Pacific/Noumea',
        'Pacific/Pago_Pago',
        'Pacific/Port_Moresby',
        'Pacific/Tongatapu',
        // UTC
        'UTC',
      ],
      default: 'Asia/Hong_Kong',
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Convert _id to id for NextAuth compatibility
        ret.id = ret._id.toString();
        ret._id = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Create indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: ExtendedAdapterUser) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name || '';
});

// Pre-save middleware to set name if firstName or lastName changes
UserSchema.pre('save', function (next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  next();
});

// Method to check if user has a specific role
UserSchema.methods.hasRole = function (role: ExtendedAdapterUser['role']) {
  return this.role === role;
};

// Method to check if user is an admin
UserSchema.methods.isAdmin = function () {
  return this.role === 'ADMIN';
};

// @Model
const registeredModel: Model<ExtendedAdapterUser> = mongoose.models.User;
export default registeredModel || mongoose.model<ExtendedAdapterUser>('User', UserSchema);
