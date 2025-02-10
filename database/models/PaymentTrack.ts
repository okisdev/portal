import mongoose, { Schema, type Document } from 'mongoose';

export interface IPaymentTrack extends Document {
  contactId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  stripePaymentId?: string;
  linkClicked: boolean;
  clickedAt?: Date;
  paidAt?: Date;
  expiresAt?: Date;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTrackSchema = new Schema<IPaymentTrack>(
  {
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // in cents
    currency: { type: String, required: true, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'clicked', 'paid', 'failed'],
      default: 'pending',
      required: true,
    },
    stripePaymentId: String,
    linkClicked: { type: Boolean, default: false },
    clickedAt: Date,
    paidAt: Date,
    expiresAt: Date,
    metadata: String, // JSON string for additional data
  },
  {
    timestamps: true,
  }
);

// Create indexes
PaymentTrackSchema.index({ contactId: 1 });
PaymentTrackSchema.index({ userId: 1 });
PaymentTrackSchema.index({ status: 1 });
PaymentTrackSchema.index({ stripePaymentId: 1 });

export default mongoose.models.PaymentTrack || mongoose.model<IPaymentTrack>('PaymentTrack', PaymentTrackSchema);
