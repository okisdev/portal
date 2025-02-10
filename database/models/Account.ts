import mongoose, { type Model } from 'mongoose';
import type { AdapterAccount } from 'next-auth/adapters';

export interface IAccount extends Omit<AdapterAccount, 'expires_at'> {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

const AccountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: String,
    access_token: String,
    expires_at: Number,
    token_type: String,
    scope: String,
    id_token: String,
    session_state: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
) as mongoose.Schema<IAccount>;

// Virtuals
AccountSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: 'id',
  justOne: true,
});

// Indexes
AccountSchema.index({ userId: 1 });
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
AccountSchema.index({ access_token: 1 });
AccountSchema.index({ refresh_token: 1 });

// Pre-save middleware
AccountSchema.pre('save', function (next) {
  // Ensure tokens are trimmed
  if (this.access_token) this.access_token = this.access_token.trim();
  if (this.refresh_token) this.refresh_token = this.refresh_token.trim();
  if (this.id_token) this.id_token = this.id_token.trim();
  next();
});

const registeredModel: Model<IAccount> = mongoose.models.Account;
export default registeredModel || mongoose.model<IAccount>('Account', AccountSchema);
