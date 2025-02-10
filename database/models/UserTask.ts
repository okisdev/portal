import mongoose, { Schema, type Document } from 'mongoose';

export interface IUserTask extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  status: string;
  priority: string;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: Schema.Types.ObjectId;
  labels?: string;
  attachments?: string;
  parentTaskId?: Schema.Types.ObjectId;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserTaskSchema = new Schema<IUserTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    content: String, // Rich text content for detailed task documentation
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    dueDate: Date,
    completedAt: Date,
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    labels: String, // JSON array of labels/tags
    attachments: String, // JSON array of attachment URLs/metadata
    parentTaskId: { type: Schema.Types.ObjectId, ref: 'UserTask' }, // for subtasks
    metadata: String, // JSON string for additional data
  },
  {
    timestamps: true,
  }
);

// Create indexes
UserTaskSchema.index({ userId: 1 });
UserTaskSchema.index({ assignedTo: 1 });
UserTaskSchema.index({ status: 1 });
UserTaskSchema.index({ priority: 1 });
UserTaskSchema.index({ dueDate: 1 });
UserTaskSchema.index({ parentTaskId: 1 });

export default mongoose.models.UserTask || mongoose.model<IUserTask>('UserTask', UserTaskSchema);
