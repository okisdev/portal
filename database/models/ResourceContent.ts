import mongoose, { Schema, type Document } from 'mongoose';

export interface IResourceContent extends Document {
  title: string;
  description?: string;
  content: string;
  tags?: string;
  visibility: string;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceContentSchema = new Schema<IResourceContent>(
  {
    title: { type: String, required: true },
    description: String,
    content: { type: String, required: true },
    tags: String, // JSON array of tags
    visibility: {
      type: String,
      enum: ['PUBLIC', 'SHARED', 'PRIVATE'],
      default: 'PRIVATE',
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Create indexes
ResourceContentSchema.index({ title: 'text', content: 'text' });
ResourceContentSchema.index({ createdBy: 1 });
ResourceContentSchema.index({ visibility: 1 });
ResourceContentSchema.index({ tags: 1 });

export default mongoose.models.ResourceContent || mongoose.model<IResourceContent>('ResourceContent', ResourceContentSchema);
